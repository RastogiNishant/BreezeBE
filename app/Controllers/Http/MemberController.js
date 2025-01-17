const Event = use('Event')
const File = use('App/Classes/File')
const Income = use('App/Models/Income')
const IncomeProof = use('App/Models/IncomeProof')
const MemberFile = use('App/Models/MemberFile')
const MemberService = use('App/Services/MemberService')
const MemberPermissionService = use('App/Services/MemberPermissionService')
const UserService = use('App/Services/UserService')
const TenantService = use('App/Services/TenantService')
const Member = use('App/Models/Member')
const User = use('App/Models/User')
const Tenant = use('App/Models/Tenant')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const { omit } = require('lodash')
const imageMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG]
const docMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG, File.IMAGE_PDF]
const NoticeService = use('App/Services/NoticeService')

const {
  VISIBLE_TO_SPECIFIC,
  ROLE_USER,
  ERROR_WRONG_HOUSEHOLD_INVITATION_DATA,
  VISIBLE_TO_NOBODY,
  STATUS_ACTIVE,
  STATUS_DELETE,
  MEMBER_FILE_TYPE_PASSPORT,
  MEMBER_FILE_TYPE_DEBT,
  MEMBER_FILE_RENT_ARREARS_DOC,
  MEMBER_FILE_DEBT_PROOFS_DOC,
  MEMBER_FILE_PASSPORT_DOC,
  MEMBER_FILE_EXTRA_RENT_ARREARS_DOC,
  MEMBER_FILE_EXTRA_DEBT_PROOFS_DOC
} = require('../../constants')

const {
  exceptions: { ONLY_HOUSEHOLD_ADD_MEMBER }
} = require('../../exceptions')
/**
 *
 */
class MemberController {
  /**
   *
   */
  async getMembers({ auth, response }) {
    let userId = auth.user.id
    if (auth.user.owner_id) {
      const owner = await UserService.getHousehouseId(userId)
      userId = owner.owner_id
    }

    const members = await MemberService.getMembers(userId)
    const myMemberId = await MemberService.getMemberIdByOwnerId(auth.user)
    const memberPermissions = (await MemberPermissionService.getMemberPermission(myMemberId)).rows
    const userIds = memberPermissions ? memberPermissions.map((mp) => mp.user_id) : []
    userIds.push(auth.user.id)
    response.res({ members, permittedUserIds: userIds })
  }

  async confirmBySMS({ request, response }) {
    const { member_id, phone, code } = request.all()
    try {
      await MemberService.confirmSMS(member_id, phone, code)
      response.res(true)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async sendUserConfirmBySMS({ request, response }) {
    const { member_id, phone } = request.all()

    try {
      await MemberService.sendSMS(member_id, phone)
      response.res(true)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async addMember({ request, auth, response }) {
    const trx = await Database.beginTransaction()
    try {
      const data = request.all()

      if (!(await UserService.isHouseHold(auth.user.id))) {
        throw new HttpException(ONLY_HOUSEHOLD_ADD_MEMBER, 400)
      }

      const files = await File.saveRequestFiles(request, [
        { field: 'avatar', mime: imageMimes, isPublic: true },
        { field: 'rent_arrears_doc', mime: docMimes, isPublic: false },
        { field: 'debt_proof', mime: docMimes, isPublic: false },
        { field: 'passport', mime: docMimes, isPublic: false }
      ])
      if (files.debt_proof) {
        files.debt_proof = Array.isArray(files.debt_proof) ? files.debt_proof : [files.debt_proof]
      }
      const user_id = auth.user.id

      if (!data.email) {
        data.is_verified =true
        // throw new HttpException('You should specify email to add member', 400)
      }
      let existingUser = false
      if (data.email) {
        const member = await Member.query().select('email').where('email', data.email).first()

        const tenant = await User.query().select('email').where('email', data.email).first()

        if (member || tenant) {
          throw new HttpException('Member already exists with this email', 400)
        }

        existingUser = await User.query().where({ email: data.email, role: ROLE_USER }).first()

        if (existingUser && existingUser.owner_id) {
          throw new HttpException('This user is a housekeeper already.', 400) 
        }

        if (existingUser) {
          existingUser.owner_id = user_id
          existingUser.is_household_invitation_onboarded = false
          existingUser.save(trx)

          data.owner_user_id = existingUser.id
        }
      }

      const createdMember = await MemberService.createMember({ ...data, ...files }, user_id, trx)

      if (files.passport) {
        const memberFile = new MemberFile()
        memberFile.merge({
          file: files.passport,
          type: MEMBER_FILE_TYPE_PASSPORT,
          status: STATUS_ACTIVE,
          member_id: createdMember.id
        })
        await memberFile.save(trx)
      }

      if (data.email) {
        await MemberService.sendInvitationCode(
          {
            member: createdMember,
            id: createdMember.id,
            userId: user_id,
            isExisting_user: !!existingUser
          },
          trx
        )
        if (existingUser) {
          MemberService.emitMemberInvitation({
            data: createdMember.toJSON(),
            user_id: existingUser.id
          })
        }
      }

      /**
       * Created by YY
       * if an adult A is going to let his profile visible to adult B who is created newly
       *  */
      if (data.visibility_to_other === VISIBLE_TO_SPECIFIC) {
        await MemberPermissionService.createMemberPermission(createdMember.id, user_id, trx)
      }

      await trx.commit()

      Event.fire('tenant::update', user_id)

      response.res(createdMember)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async updateMember({ request, auth, response }) {
    const { id, ...data } = request.all()
    let files
    try {
      files = await File.saveRequestFiles(request, [
        { field: 'avatar', mime: imageMimes, isPublic: true },
        { field: MEMBER_FILE_RENT_ARREARS_DOC, mime: docMimes, isPublic: false },
        { field: MEMBER_FILE_DEBT_PROOFS_DOC, mime: docMimes, isPublic: false },
        { field: MEMBER_FILE_TYPE_PASSPORT, mime: docMimes, isPublic: false }
      ])
    } catch (err) {
      throw new HttpException(err.message, 422)
    }

    const trx = await Database.beginTransaction()
    try {
      const memberQuery = await Member.query()
        .select(Database.raw(`distinct on (user_id) user_id, id`))
        .where('id', id)
        .orderBy('user_id', 'asc')
        .first()
      if (!memberQuery) {
        throw new HttpException('Member does not exist.')
      }
      if (+memberQuery.user_id === +auth.user.id) {
        // this is an edit of his own self
        if (data.firstname || data.secondname) {
          const userHasEmptyName = await User.query()
            .where(Database.raw('firstname is null'))
            .where('id', auth.user.id)
            .first()
          if (userHasEmptyName) {
            await userHasEmptyName.updateItemWithTrx(
              { firstname: data.firstname, secondname: data?.secondname || null },
              trx
            )
          }
        }
      }

      if (files.passport) {
        const memberFile = new MemberFile()
        memberFile.merge({
          file: files.passport,
          type: MEMBER_FILE_TYPE_PASSPORT,
          status: STATUS_ACTIVE,
          member_id: id
        })
        await memberFile.save(trx)
      }

      let member = await MemberService.allowEditMemberByPermission(auth.user, id)
      if (files.debt_proof) {
        files.debt_proof = Array.isArray(files.debt_proof) ? files.debt_proof : [files.debt_proof]
        files.debt_proof = [...(member.debt_proof || []), ...files.debt_proof]
      }
      const newData = member.owner_user_id ? omit(data, ['email']) : data

      if (data?.phone && data?.phone !== member.phone) {
        newData.phone_verified = false
      }

      const result = await member.updateItemWithTrx({ ...newData, ...files }, trx)
      await trx.commit()

      member = await MemberService.getMemberWithPassport(member.id)

      Event.fire('tenant::update', member.user_id)
      return response.res(member)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 422)
    }
  }

  /**
   *
   */
  async removeMember({ request, auth, response }) {
    const { id } = request.all()
    // test if member to delete exists
    let member = await Member.query().where('id', id).first()
    if (!member) {
      throw new HttpException('Member does not exist.')
    }

    if (auth.user.owner_id && auth.user.owner_id === member.user_id) {
      // This member is the owner and he wants to disconnect himself from the household
      member = await Member.query().where('owner_user_id', auth.user.id).first()
    } else {
      // test if member is under the user's household
      if (member.user_id !== auth.user.id) {
        throw new HttpException(`You cannot remove a member that does not belong to your household`)
      }
      // test if user is deleting main member
      const mainMember = await Member.query()
        .innerJoin(
          Database.raw(
            `(select MIN(id) as main_member_id, user_id from members where user_id='${auth.user.id}' group by user_id ) as main_member`
          ),
          'main_member.user_id',
          'members.user_id'
        )
        .where('id', id)
        .first()
      if (mainMember.main_member_id === member.id) {
        throw new HttpException('You cannot remove the main member.')
      }
    }

    const trx = await Database.beginTransaction()
    try {
      const owner_id = member.owner_user_id
      const user_id = member.user_id

      if (owner_id) {
        MemberPermissionService.deletePermissionByUser(owner_id, trx)
        await UserService.removeUserOwnerId(owner_id, trx)
        await MemberService.createMainMember(owner_id, trx)
      }
      await MemberPermissionService.deletePermission(member.id, trx)
      await MemberService.getMemberQuery().where('id', member.id).delete().transacting(trx)

      await trx.commit()
      Event.fire('tenant::update', user_id)
      if (owner_id) {
        Event.fire('tenant::update', owner_id)
      }
      if (auth.user.owner_id) {
        await NoticeService.prospectHouseholdDisconnected(user_id)
      }
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  // Check my visibility to specified adult
  async checkVisibilitySetting({ auth, response, request }) {
    const { member_id } = request.all()
    const permissionExists = await MemberPermissionService.isExistPermission(
      member_id,
      auth.user.id
    )
    return response.res(permissionExists)
  }

  async showMe({ request, auth, response }) {
    const { member_id, visibility_to_other } = request.all()
    const trx = await Database.beginTransaction()
    try {
      if (visibility_to_other === VISIBLE_TO_NOBODY) {
        // hidden
        await MemberPermissionService.deletePermission(member_id, trx)
      }
      if (visibility_to_other === VISIBLE_TO_SPECIFIC) {
        // Event.fire('memberPermission:create', member_id, auth.user.id)
        await MemberPermissionService.createMemberPermission(member_id, auth.user.id, trx)
      }
      await trx.commit()
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async removeMemberDocs({ request, auth, response }) {
    const { id, field, uri } = request.all()

    const user_id = auth.user.owner_id || auth.user.id
    const member = await MemberService.allowEditMemberByPermission(auth.user, id)

    if (!member[field]) {
      return response.res(false)
    }

    member[field] = Array.isArray(member[field]) ? member[field] : [member[field]]
    const deleteFiles = uri ? member[field].find((file) => file === uri) : member[field]
    await File.remove(deleteFiles, false)

    member[field] = uri ? member[field].filter((file) => file !== uri) : null

    if (!member[field]?.length) {
      member[field] = null
    } else {
      member[field] = field !== MEMBER_FILE_DEBT_PROOFS_DOC ? member[field][0] : member[field]
    }

    await member.save()

    Event.fire('tenant::update', user_id)
    response.res(true)
  }

  /**
   *
   */
  // MERGED TENANT
  async addMemberIncome({ request, auth, response }) {
    const { id, ...data } = request.all()

    const member = await MemberService.allowEditMemberByPermission(auth.user, id)

    const files = await File.saveRequestFiles(request, [
      { field: 'company_logo', mime: imageMimes, isPublic: true }
    ])

    const trx = await Database.beginTransaction()
    try {
      const income = await MemberService.addIncome({ ...data, ...files }, member, trx)

      await trx.commit()
      Event.fire('tenant::update', member.user_id)
      response.res(income)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  // MERGED TENANT
  async editIncome({ request, auth, response }) {
    const { income_id, id, ...rest } = request.all()

    const member = await MemberService.allowEditMemberByPermission(auth.user, id)

    const income = await Income.query()
      .where('id', income_id)
      .whereIn('member_id', [member.id])
      .first()

    if (!income) {
      throw new HttpException('Income not exists', 400)
    }

    const trx = await Database.beginTransaction()
    try {
      const files = await File.saveRequestFiles(request, [
        { field: 'company_logo', mime: imageMimes, isPublic: true }
      ])

      await Income.query()
        .where('id', income_id)
        .whereIn('member_id', [member.id])
        .update({ ...rest, ...files })
        .transacting(trx)

      await trx.commit()
      Event.fire('tenant::update', member.user_id)
      response.res(income)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  // MERGED TENANT
  async removeMemberIncome({ request, auth, response }) {
    const { income_id } = request.all()
    const user_id = auth.user.owner_id || auth.user.id
    const trx = await Database.beginTransaction()
    try {
      await Income.query()
        .where('id', income_id)
        .whereIn('member_id', function () {
          this.select('id').from('members').where('user_id', user_id)
        })
        .update({ status: STATUS_DELETE })
        .transacting(trx)

      await trx.commit()
      Event.fire('tenant::update', user_id)
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  // MERGED TENANT
  async addMemberIncomeProof({ request, auth, response }) {
    // NOTE: expire_date here is the month when the income is earned.
    const { income_id, ...rest } = request.all()
    const user_id = auth.user.owner_id || auth.user.id
    const income = await MemberService.getIncomeByIdAndUser(income_id, auth.user)
    if (!income) {
      throw new HttpException('Invalid income', 400)
    }

    const files = await File.saveRequestFiles(request, [
      { field: 'file', mime: docMimes, isPublic: false }
    ])
    const incomeProof = await MemberService.addMemberIncomeProof({ ...rest, ...files }, income)
    Event.fire('tenant::update', user_id)
    response.res(incomeProof)
  }

  /**
   *
   */
  // MERGED TENANT
  async removeMemberIncomeProof({ request, auth, response }) {
    const { id } = request.all()
    const user_id = auth.user.owner_id || auth.user.id
    const proofQuery = IncomeProof.query()
      .select('income_proofs.*')
      .innerJoin({ _i: 'incomes' }, function () {
        this.on('_i.id', 'income_proofs.income_id').on('_i.status', STATUS_ACTIVE)
      })
      .innerJoin({ _m: 'members' }, '_m.id', '_i.member_id')
      .select('_i.member_id')
      .where('income_proofs.id', id)
      .where('income_proofs.status', STATUS_ACTIVE)

    const proof = await proofQuery.first()
    if (proof) {
      await MemberService.allowEditMemberByPermission(auth.user, proof.member_id)
    } else {
      throw new HttpException('Invalid income proof', 400)
    }
    // mark it with STATUS_DELETE
    await IncomeProof.query().where('id', proof.id).update({ status: STATUS_DELETE })
    Event.fire('tenant::update', user_id)
    response.res(true)
  }

  async addPassportImage({ request, auth, response }) {
    try {
      const ret = await MemberService.addExtraProofs(request, auth.user)
      response.res(ret)
    } catch (e) {
      throw new HttpException(e.message, 422)
    }
  }

  async sendInviteCode({ request, auth, response }) {
    const { id } = request.all()

    const userId = auth.user.id
    const trx = await Database.beginTransaction()
    try {
      const result = await MemberService.sendInvitationCode({ id, userId }, trx)
      await trx.commit()
      response.res(result)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  async acceptInvitation({ request, response, auth }) {
    const { visibility_to_other } = request.all()
    try {
      response.res(await MemberService.mergeTenantAccounts(auth.user, visibility_to_other))
    } catch (e) {
      console.log({ e })
      throw new HttpException(e.message, 400)
    }
  }

  async refuseInvitation({ response, auth }) {
    try {
      response.res(await MemberService.refuseHouseholdInvitation(auth.user))
    } catch (e) {
      console.log({ e })
      throw new HttpException(e.message, 400)
    }
  }

  async removeInviteConnection({ request, auth, response }) {}

  async prepareHouseholdInvitationDetails({ auth, response }) {
    const userEmail = auth.user.email
    const member = await Member.query().where({ email: userEmail, is_verified: false }).first()
    if (member) {
      try {
        const fetchMembers = Member.query()
          .where('user_id', member.user_id)
          .where('is_verified', true)
          .with('incomes', function (b) {
            b.with('proofs')
          })
          .fetch()
        const fetchTenant = Tenant.query().where('user_id', member.user_id).firstOrFail()

        const [invitorUserMembers, tenant] = await Promise.all([fetchMembers, fetchTenant])

        const members = await MemberService.limitMemberDataByPermission(
          auth.user,
          invitorUserMembers.rows
        )

        response.res({
          members,
          tenant: tenant.toJSON({ isShort: true })
        })
      } catch (e) {
        console.log(e)
      }
    } else {
      throw new HttpException(
        "You don't have household invitation",
        400,
        ERROR_WRONG_HOUSEHOLD_INVITATION_DATA
      )
    }
  }

  async deleteExtraImage({ request, auth, response }) {
    const { member_file_id, id } = request.all()
    const member = await MemberService.allowEditMemberByPermission(auth.user, id)
    if (!member) {
      throw new HttpException('No permission to delete passport')
    }

    const affected_rows = await MemberFile.query()
      .update({ status: STATUS_DELETE })
      .where('id', member_file_id)
      .where('member_id', id)
    return response.res({ deleted: affected_rows })
  }
}

module.exports = MemberController
