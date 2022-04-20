const Event = use('Event')
const File = use('App/Classes/File')
const Income = use('App/Models/Income')
const IncomeProof = use('App/Models/IncomeProof')
const MemberService = use('App/Services/MemberService')
const MemberPermissionService = use('App/Services/MemberPermissionService')
const UserService = use('App/Services/UserService')
const TenantService = use('App/Services/TenantService')
const Member = use('App/Models/Member')
const User = use('App/Models/User')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const { omit } = require('lodash')
const imageMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG]
const docMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG, File.IMAGE_PDF]

const { VISIBLE_TO_SPECIFIC, ROLE_USER } = require('../../constants')
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

    let members = (await MemberService.getMembers(userId)).toJSON()
    const myMemberId = await MemberService.getMemberIdByOwnerId(auth.user.id, auth.user.owner_id)
    const memberPermissions = (await MemberPermissionService.getMemberPermission(myMemberId)).rows
    let userIds = memberPermissions ? memberPermissions.map((mp) => mp.user_id) : []
    userIds.push(auth.user.id)

    // NOTE: We need all data to show adults fields completed or not.

    // if (members) {
    //   members[0].owner_user_id = userId // first member will be household in default
    //   members = members.map((m) => {
    //     if (auth.user.owner_id) {
    //       return userIds.includes(m.owner_user_id) ? m : pick(m, Member.limitFieldsList)
    //     } else {
    //       //if housekeeper updates his/her profile
    //       if (m.owner_user_id) {
    //         return userIds.includes(m.owner_user_id) ? m : pick(m, Member.limitFieldsList)
    //       }
    //       return m
    //     }
    //   })
    // }
    response.res(members)
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
        const member = await MemberService.createMember({}, user_id, trx)
        await Promise.all([
          MemberService.calcTenantMemberData(user_id, trx),
          TenantService.updateSelectedAdultsCount(auth.user, selected_adults_count),
        ])
        await trx.commit()
        return response.res(member)
      } else {
        trx.rollback()
        await TenantService.updateSelectedAdultsCount(auth.user, selected_adults_count),
          response.res(null)
      }
    } catch (e) {
      trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async addMember({ request, auth, response }) {
    try {
      const data = request.all()

      const files = await File.saveRequestFiles(request, [
        { field: 'avatar', mime: imageMimes, isPublic: true },
        { field: 'rent_arrears_doc', mime: docMimes, isPublic: false },
        { field: 'debt_proof', mime: docMimes, isPublic: false },
      ])

      const user_id = auth.user.id
      const trx = await Database.beginTransaction()
      if (data.email) {
        const member = await Member.query().select('email').where('email', data.email).first()

        if (member) {
          throw new HttpException('Member already exists with this email', 400)
        }

        const existingUser = await User.query()
          .where({ email: data.email, role: ROLE_USER })
          .first()

        if (existingUser && existingUser.owner_id) {
          throw new HttpException('This user is a household already.', 400)
        }

        const result = await MemberService.createMember({ ...data, ...files }, user_id, trx)
        await MemberService.calcTenantMemberData(user_id, trx)

        /**
         * Created by YY
         * if an adult A is going to let his profile visible to adult B who is created newly
         *  */

        if (data.visibility_to_other === VISIBLE_TO_SPECIFIC) {
          Event.fire('memberPermission:create', result.id, user_id)
        }
        Event.fire('tenant::update', user_id)
        trx.commit()

        await MemberService.sendInvitationCode(result.id, user_id)

        response.res(result)
      } else {
        throw new HttpException('You should specify email to add member', 400)
      }
    } catch (e) {
      trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async updateMember({ request, auth, response }) {
    const { id, ...data } = request.all()

    console.log({ data })

    const member = await MemberService.getMember(id, auth.user.id, auth.user.owner_id)
    if (!member) {
      throw new HttpException('Member not exists or permission denied', 400)
    }

    // if (auth.user.owner_id) {
    //   user_id = member.owner_user_id
    // }

    const files = await File.saveRequestFiles(request, [
      { field: 'avatar', mime: imageMimes, isPublic: true },
      { field: 'rent_arrears_doc', mime: docMimes, isPublic: false },
      { field: 'debt_proof', mime: docMimes, isPublic: false },
    ])

    const newData = member.owner_user_id ? omit(data, ['email']) : data

    if (data?.phone !== member.phone) {
      newData.phone_verified = false
    }

    await member.updateItem({ ...newData, ...files })
    await MemberService.calcTenantMemberData(member.user_id)

    Event.fire('tenant::update', member.user_id)

    response.res(member)
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

      /**
       * ToDo
       * If a household deletes a member, we might need to delete household account from user table
       * Need to confirm later with the customer
       */

      /** @OsmanKanadikirik We don't need to delete the account, we should let the member continue to using app as a tenant */

      const owner_id = member.owner_user_id
      const user_id = member.user_id

      if (owner_id) {
        await member.updateItem({
          user_id: owner_id,
          owner_user_id: null,
          email: null,
          code: null,
        })
        await MemberService.calcTenantMemberData(owner_id, trx)
        await UserService.removeUserOwnerId(owner_id, trx)
      } else {
        await MemberService.getMemberQuery().where('id', id).delete(trx)
      }

      await MemberPermissionService.deletePermission(id, trx)
      await MemberService.calcTenantMemberData(user_id, trx)

      Event.fire('tenant::update', user_id)
      trx.commit()
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
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
        Event.fire('memberPermission:create', member_id, auth.user.id)
      }
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
    const member = await MemberService.getMemberQuery()
      .where('id', id)
      .where('user_id', user_id)
      .first()

    if (!member) {
      throw new HttpException('Invalid member', 400)
    }

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

    const member = await MemberService.getMember(id, auth.user.id, auth.user.owner_id)

    if (!member) {
      throw new HttpException('Member not exists or permission denied', 400)
    }
    const files = await File.saveRequestFiles(request, [
      { field: 'company_logo', mime: imageMimes, isPublic: true },
    ])

    const income = await MemberService.addIncome({ ...data, ...files }, member)
    await MemberService.updateUserIncome(member.user_id)

    Event.fire('tenant::update', member.user_id)
    response.res(income)
  }

  /**
   *
   */
  //MERGED TENANT
  async editIncome({ request, auth, response }) {
    const { income_id, id, ...rest } = request.all()

    const member = await MemberService.getMember(id, auth.user.id, auth.user.owner_id)
    if (!member) {
      throw new HttpException('Member not exists or permission denied', 400)
    }

    const income = await Income.query()
      .where('id', income_id)
      .whereIn('member_id', [member.id])
      .first()

    if (!income) {
      throw new HttpException('Income not exists', 400)
    }
    const files = await File.saveRequestFiles(request, [
      { field: 'company_logo', mime: imageMimes, isPublic: true },
    ])

    await income.updateItem({ ...rest, ...files })
    await MemberService.updateUserIncome(member.user_id)

    Event.fire('tenant::update', member.user_id)
    response.res(income)
  }

  /**
   *
   */
  //MERGED TENANT
  async removeMemberIncome({ request, auth, response }) {
    const { income_id } = request.all()
    const user_id = auth.user.owner_id || auth.user.id
    await Income.query()
      .where('id', income_id)
      .whereIn('member_id', function () {
        this.select('id').from('members').where('user_id', user_id)
      })
      .delete()

    Event.fire('tenant::update', user_id)
    response.res(true)
  }

  /**
   *
   */
  //MERGED TENANT
  async addMemberIncomeProof({ request, auth, response }) {
    const { income_id, ...rest } = request.all()

    const income = await MemberService.getIncomeByIdAndUser(income_id, auth.user)
    if (!income) {
      throw new HttpException('Invalid income', 400)
    }

    const files = await File.saveRequestFiles(request, [
      { field: 'file', mime: docMimes, isPublic: false },
    ])
    const incomeProof = await MemberService.addMemberIncomeProof({ ...rest, ...files }, income)

    response.res(incomeProof)
  }

  /**
   *
   */
  //MERGED TENANT
  async removeMemberIncomeProof({ request, auth, response }) {
    const { id } = request.all()

    // get proof
    let proofQuery = IncomeProof.query()
      .select('income_proofs.*')
      .innerJoin({ _i: 'incomes' }, '_i.id', 'income_proofs.income_id')
      .innerJoin({ _m: 'members' }, '_m.id', '_i.member_id')
      .where('income_proofs.id', id)
      .where('user_id', auth.user.owner_id || auth.user.id)

    // if (auth.user.role === ROLE_USER) {
    //   proofQuery = proofQuery.whereNull('owner_user_id').where('user_id', auth.user.id)
    // } else {
    //   proofQuery = proofQuery.where('owner_user_id', auth.user.id)
    // }

    const proof = await proofQuery.first()

    if (!proof) {
      throw new HttpException('Invalid income proof', 400)
    }
    await IncomeProof.query().where('id', proof.id).delete()

    response.res(true)
  }

  async sendInviteCode({ request, auth, response }) {
    const { id } = request.all()

    const userId = auth.user.id
    try {
      const result = await MemberService.sendInvitationCode(id, userId)
      return response.res(result)
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  async confirmInviteCode({ request, response, auth }) {
    const { email, code } = request.all()
    try {
      response.res(await MemberService.getInvitationCode(email, code, auth.user))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async removeInviteConnection({ request, auth, response }) {}
}

module.exports = MemberController
