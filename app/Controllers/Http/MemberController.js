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
  MEMBER_FILE_EXTRA_DEBT_PROOFS_DOC,
} = require('../../constants')
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

    let members = await MemberService.getMembers(userId)
    const myMemberId = await MemberService.getMemberIdByOwnerId(auth.user)
    const memberPermissions = (await MemberPermissionService.getMemberPermission(myMemberId)).rows
    let userIds = memberPermissions ? memberPermissions.map((mp) => mp.user_id) : []
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
  async initalizeTenantAdults({ request, response, auth }) {
    const { selected_adults_count } = request.all()
    const user_id = auth.user.id
    const trx = await Database.beginTransaction()

    try {
      const isInitializedAlready = await TenantService.checkAdultsInitialized(user_id)

      if (!isInitializedAlready) {
        const member = await MemberService.createMember({ is_verified: true }, user_id, trx)
        await TenantService.updateSelectedAdultsCount(auth.user, selected_adults_count, trx)
        await trx.commit()
        Event.fire('tenant::update', user_id)
        return response.res(member)
      } else {
        await trx.rollback()
        await TenantService.updateSelectedAdultsCount(auth.user, selected_adults_count)
        response.res(null)
      }
    } catch (e) {
      await trx.rollback()
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

      const files = await File.saveRequestFiles(request, [
        { field: 'avatar', mime: imageMimes, isPublic: true },
        { field: 'rent_arrears_doc', mime: docMimes, isPublic: false },
        { field: 'debt_proof', mime: docMimes, isPublic: false },
        { field: 'passport', mime: docMimes, isPublic: false },
      ])

      const user_id = auth.user.id

      if (!data.email) {
        throw new HttpException('You should specify email to add member', 400)
      }

      const member = await Member.query().select('email').where('email', data.email).first()

      if (member) {
        throw new HttpException('Member already exists with this email', 400)
      }

      const existingUser = await User.query().where({ email: data.email, role: ROLE_USER }).first()

      if (existingUser && existingUser.owner_id) {
        throw new HttpException('This user is a household already.', 400)
      }

      if (existingUser) {
        data.owner_user_id = existingUser.id
      }

      const createdMember = await MemberService.createMember({ ...data, ...files }, user_id, trx)

      if (files.passport) {
        const memberFile = new MemberFile()
        memberFile.merge({
          file: files.passport,
          type: MEMBER_FILE_TYPE_PASSPORT,
          status: STATUS_ACTIVE,
          member_id: createdMember.id,
        })
        await memberFile.save(trx)
      }

      /**
       * Created by YY
       * if an adult A is going to let his profile visible to adult B who is created newly
       *  */

      if (data.visibility_to_other === VISIBLE_TO_SPECIFIC) {
        Event.fire('memberPermission:create', createdMember.id, user_id)
      }

      await MemberService.sendInvitationCode(
        {
          member: createdMember,
          id: createdMember.id,
          userId: user_id,
        },
        trx
      )

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
    //FIXME: id must be checked whether this id is a member of the current user
    //this will cause sql query if NOT.
    const { id, ...data } = request.all()
    let files
    try {
      files = await File.saveRequestFiles(request, [
        { field: 'avatar', mime: imageMimes, isPublic: true },
        { field: MEMBER_FILE_RENT_ARREARS_DOC, mime: docMimes, isPublic: false },
        { field: MEMBER_FILE_DEBT_PROOFS_DOC, mime: docMimes, isPublic: false },
        { field: MEMBER_FILE_TYPE_PASSPORT, mime: docMimes, isPublic: false },
      ])
    } catch (err) {
      throw new HttpException(err.message, 422)
    }

    const trx = await Database.beginTransaction()
    try {
      if (files.passport) {
        let memberFile = new MemberFile()
        memberFile.merge({
          file: files.passport,
          type: MEMBER_FILE_TYPE_PASSPORT,
          status: STATUS_ACTIVE,
          member_id: id,
        })
        await memberFile.save(trx)
      }

      let member = await MemberService.allowEditMemberByPermission(auth.user, id)
      const newData = member.owner_user_id ? omit(data, ['email']) : data

      if (data?.phone !== member.phone) {
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
    //TODO: add condition to prevent user delete main adult
    const { id } = request.all()
    const trx = await Database.beginTransaction()

    try {
      let member = await Member.query().where('id', id).first()
      if (!member) {
        throw new HttpException('Member not exists', 400)
      } else if (auth.user.owner_id && auth.user.owner_id === member.user_id) {
        //TODO: add one more condition to check if this member is belong to authenticated user by "owner_user_id"
        //if user trying to disconnect from the tenant that invited
        //we will process it as, tenant is trying to remove household
        member = await Member.query().where('owner_user_id', auth.user.id).first()
      } else if (member.user_id !== auth.user.id && member.owner_user_id !== auth.user.id) {
        throw new HttpException('Permission denied', 400)
      }

      const owner_id = member.owner_user_id
      const user_id = member.user_id

      if (owner_id) {
        MemberPermissionService.deletePermissionByUser(owner_id, trx)
      }
      await MemberPermissionService.deletePermission(member.id, trx)

      if (owner_id) {
        await member.updateItem({
          user_id: owner_id,
          owner_user_id: null,
          email: null,
          code: null,
        })
        await UserService.removeUserOwnerId(owner_id, trx)
      } else {
        await MemberService.getMemberQuery().where('id', member.id).delete(trx)
      }

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
        //hidden
        await MemberPermissionService.deletePermission(member_id, trx)
      }
      if (visibility_to_other === VISIBLE_TO_SPECIFIC) {
        //Event.fire('memberPermission:create', member_id, auth.user.id)
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
    const { id, field } = request.all()

    const user_id = auth.user.owner_id || auth.user.id
    const member = await MemberService.allowEditMemberByPermission(auth.user, id)

    if (!member[field]) {
      return response.res(false)
    }

    await File.remove(member[field], false)
    member[field] = null
    await member.save()

    Event.fire('tenant::update', user_id)
    response.res(true)
  }

  /**
   *
   */
  //MERGED TENANT
  async addMemberIncome({ request, auth, response }) {
    const { id, ...data } = request.all()

    const member = await MemberService.allowEditMemberByPermission(auth.user, id)

    const files = await File.saveRequestFiles(request, [
      { field: 'company_logo', mime: imageMimes, isPublic: true },
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
  //MERGED TENANT
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
        { field: 'company_logo', mime: imageMimes, isPublic: true },
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
  //MERGED TENANT
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
        .delete()
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
  //MERGED TENANT
  async addMemberIncomeProof({ request, auth, response }) {
    const { income_id, ...rest } = request.all()
    const user_id = auth.user.owner_id || auth.user.id
    const income = await MemberService.getIncomeByIdAndUser(income_id, auth.user)
    if (!income) {
      throw new HttpException('Invalid income', 400)
    }

    const files = await File.saveRequestFiles(request, [
      { field: 'file', mime: docMimes, isPublic: false },
    ])
    const incomeProof = await MemberService.addMemberIncomeProof({ ...rest, ...files }, income)
    Event.fire('tenant::update', user_id)
    response.res(incomeProof)
  }

  /**
   *
   */
  //MERGED TENANT
  async removeMemberIncomeProof({ request, auth, response }) {
    const { id } = request.all()
    const user_id = auth.user.owner_id || auth.user.id
    let proofQuery = IncomeProof.query()
      .select('income_proofs.*')
      .innerJoin({ _i: 'incomes' }, '_i.id', 'income_proofs.income_id')
      .innerJoin({ _m: 'members' }, '_m.id', '_i.member_id')
      .select('_i.member_id')
      .where('income_proofs.id', id)

    const proof = await proofQuery.first()
    if (proof) {
      await MemberService.allowEditMemberByPermission(auth.user, proof.member_id)
    } else {
      throw new HttpException('Invalid income proof', 400)
    }
    await IncomeProof.query().where('id', proof.id).delete()
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
          tenant: tenant.toJSON({ isShort: true }),
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
