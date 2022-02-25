const Event = use('Event')
const File = use('App/Classes/File')
const Income = use('App/Models/Income')
const IncomeProof = use('App/Models/IncomeProof')
const MemberService = use('App/Services/MemberService')
const MemberPermissionService = use('App/Services/MemberPermissionService')
const UserService = use('App/Services/UserService')
const Member = use('App/Models/Member')
const DataStorage = use('DataStorage')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const { omit, pick } = require('lodash')
const imageMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG]
const docMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG, File.IMAGE_PDF]

const { ROLE_HOUSEKEEPER, VISIBLE_TO_EVERYBODY, VISIBLE_TO_HOUSEHOLD, VISIBLE_TO_SPECIFIC, VISIBLE_TO_NOBODY, ROLE_USER } = require('../../constants')
/**
 *
 */
class MemberController {
  /**
   *
   */
  async getMembers({ request, auth, response }) {
    let userId = auth.user.id
    if( auth.user.role === ROLE_HOUSEKEEPER ) {
      const owner = await UserService.getHousehouseId(userId)
      userId = owner.owner_id
    }

    let members = (await MemberService.getMembers(userId)).toJSON()
    const myMemberId = await MemberService.getMemberIdByOwnerId(auth.user.id, auth.user.role)    
    const memberPermissions = (await MemberPermissionService.getMemberPermission(myMemberId)).rows
    let userIds = memberPermissions?memberPermissions.map(mp=> mp.user_id):[];
    userIds.push(auth.user.id)

    if( members ) {
      members[0].owner_user_id = userId;// first member will be household in default
      members = members.map( m=> {
        if( auth.user.role == ROLE_HOUSEKEEPER ){
          return userIds.includes(m.owner_user_id)?m:pick(m, Member.limitFieldsList)
        }else {
          //if housekeeper updates his/her profile
          if( m.owner_user_id ){
            return userIds.includes(m.owner_user_id)?m:pick(m, Member.limitFieldsList)
          }
          return m
        }
      })
    }
    response.res(members)
  }

  /**
   *
   */
  async addMember({ request, auth, response }) {
    const data = request.all()

    const files = await File.saveRequestFiles(request, [
      { field: 'avatar', mime: imageMimes, isPublic: true },
      { field: 'rent_arrears_doc', mime: docMimes, isPublic: false },
      { field: 'debt_proof', mime: docMimes, isPublic: false },
    ])

    const user_id = auth.user.id
    const trx = await Database.beginTransaction()
    if( data.email) {
      const member = await Member.query()
      .select('email')
      .where('email', data.email)
      .whereNotNull('owner_user_id')
      .first()

      if(member) {
        throw new HttpException('Email exists', 400)
      }
    }

    try{
      const result = await MemberService.createMember({ ...data, ...files }, user_id, trx)
      await MemberService.calcTenantMemberData(user_id, trx)
      
      /**
       * Created by YY
       * if an adult A is going to let his profile visible to adult B who is created newly
       *  */ 

      if( data.visibility_to_other === VISIBLE_TO_SPECIFIC ) {
        Event.fire('memberPermission:create', result.id, user_id)
      }
      Event.fire('tenant::update', user_id)
      trx.commit()

      response.res(result)
    }catch(e) {
      trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async updateMember({ request, auth, response }) {
    const { id, ...data } = request.all()
    let user_id = auth.user.id
    const search_label = auth.user.role === ROLE_USER?'user_id':'owner_user_id'

    let member = null
    if( auth.user.role === ROLE_USER ) {
      member = await MemberService.getMemberQuery()
        .where('id', id)
        .whereNull('owner_user_id')
        .where(search_label, user_id)
        .first()
    }else {
      member = await MemberService.getMemberQuery()
        .where('id', id)
        .where(search_label, user_id)
        .first()
    }

    if (!member) {
      throw new HttpException('Member not exists', 400)
    }

    if( auth.role === ROLE_HOUSEKEEPER ) {
      user_id = member.owner_user_id
    }

    const files = await File.saveRequestFiles(request, [
      { field: 'avatar', mime: imageMimes, isPublic: true },
      { field: 'rent_arrears_doc', mime: docMimes, isPublic: false },
      { field: 'debt_proof', mime: docMimes, isPublic: false },
    ])

    const newData = member.owner_user_id?omit(data, ['email']):data;
    await member.updateItem({ ...newData, ...files })
    await MemberService.calcTenantMemberData(member.user_id)

    Event.fire('tenant::update', member.user_id)

    response.res(member)
  }

  /**
   *
   */
  async removeMember({ request, auth, response }) {
    const { id } = request.all()
    const trx = await Database.beginTransaction()    
    try{
      let user_id = auth.user.id
      const search_label = auth.role === ROLE_USER?'user_id':'owner_user_id'
  
      const member = await MemberService.getMemberQuery()
      .where('id', id)
      .where(search_label, user_id)
      .first()

      if( member ) {
        /**
         * ToDo
         * If a household deletes a member, we might need to delete household account from user table
         * Need to confirm later with the customer
         */

        await MemberPermissionService.deletePermission(id, trx)    
        await MemberService.getMemberQuery().where('id', id).where('user_id', member.user_id).delete(trx)
        await MemberService.calcTenantMemberData(member.user_id, trx)
    
        Event.fire('tenant::update', member.user_id)
        trx.commit()
      }
      response.res(true)
    }catch(e) {
console.log('Error remove Member')
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async removeMemberDocs({ request, auth, response }) {
    const { id, field } = request.all()
    const member = await MemberService.getMemberQuery()
      .where('id', id)
      .where('user_id', auth.user.id)
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

    Event.fire('tenant::update', auth.user.id)
    response.res(true)
  }

  /**
   *
   */
  async addMemberIncome({ request, auth, response }) {
    const { id, ...data } = request.all()
    let member = await MemberService.getMemberQuery()
      .where('id', id)
      .where('user_id', auth.user.id)
      .first()

    if (!member) {
      throw new HttpException('Member not exists', 404)
    }
    const files = await File.saveRequestFiles(request, [
      { field: 'company_logo', mime: imageMimes, isPublic: true },
    ])

    const income = await MemberService.addIncome({ ...data, ...files }, member)
    await MemberService.updateUserIncome(auth.user.id)

    Event.fire('tenant::update', auth.user.id)
    response.res(income)
  }

  /**
   *
   */
  async editIncome({ request, auth, response }) {
    const { income_id, id, ...rest } = request.all()
    const income = await Income.query()
      .where('id', income_id)
      .whereIn('member_id', function () {
        this.select('id').from('members').where('user_id', auth.user.id)
      })
      .first()

    if (!income) {
      throw new HttpException('Income not exists', 404)
    }
    const files = await File.saveRequestFiles(request, [
      { field: 'company_logo', mime: imageMimes, isPublic: true },
    ])

    await income.updateItem({ ...rest, ...files })
    await MemberService.updateUserIncome(auth.user.id)

    Event.fire('tenant::update', auth.user.id)
    response.res(income)
  }

  /**
   *
   */
  async removeMemberIncome({ request, auth, response }) {
    const { income_id } = request.all()
    await Income.query()
      .where('id', income_id)
      .whereIn('member_id', function () {
        this.select('id').from('members').where('user_id', auth.user.id)
      })
      .delete()

    Event.fire('tenant::update', auth.user.id)
    response.res(true)
  }

  /**
   *
   */
  async addMemberIncomeProof({ request, auth, response }) {
    const { income_id, ...rest } = request.all()

    const income = await MemberService.getIncomeByIdAndUser(income_id, auth.user)
    if (!income) {
      throw new HttpException('Invalid income', 404)
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
  async removeMemberIncomeProof({ request, auth, response }) {
    const { id } = request.all()

    // get proof
    const proof = await IncomeProof.query()
      .select('income_proofs.*')
      .innerJoin({ _i: 'incomes' }, '_i.id', 'income_proofs.income_id')
      .innerJoin({ _m: 'members' }, '_m.id', '_i.member_id')
      .where('income_proofs.id', id)
      .where('_m.user_id', auth.user.id)
      .first()

    if (!proof) {
      throw new HttpException('Invalid income proof', 404)
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

  async confirmInviteCode({ request, response }) {
    const { email,code } = request.all()
    try {
      response.res(await MemberService.getInvitationCode(email,code))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = MemberController
