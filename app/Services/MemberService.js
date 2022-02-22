const Database = use('Database')
const Member = use('App/Models/Member')
const Tenant = use('App/Models/Tenant')
const User = use('App/Models/User')
const Income = use('App/Models/Income')
const IncomeProof = use('App/Models/IncomeProof')
const { getHash } = require('../Libs/utils.js')
const { isEmpty } = require('lodash')
const moment = require('moment')
const MailService = use('App/Services/MailService')
const { FirebaseDynamicLinks } = use('firebase-dynamic-links')

const {
  FAMILY_STATUS_NO_CHILD,
  FAMILY_STATUS_SINGLE,
  FAMILY_STATUS_WITH_CHILD,
} = require('../constants')
const HttpException = require('../Exceptions/HttpException.js')

class MemberService {
  /**
   *
   */
  static async getMembers(userId) {
    const query = Member.query()
      .where('user_id', userId)
      .with('incomes', function (b) {
        b.with('proofs')
      })

    return (await query.fetch()).rows
  }

  /**
   * Get all tenant members and calculate general tenant params
   */
  static async calcTenantMemberData(userId) {
    const tenantData = await Database.query()
      .from('members')
      .select(
        Database.raw(`SUM(CASE WHEN child IS TRUE THEN 1 ELSE 0 END) AS minors_count`),
        Database.raw(`SUM(CASE WHEN child IS TRUE THEN 0 ELSE 1 END) AS members_count`),
        Database.raw(
          `ARRAY_AGG(EXTRACT(YEAR FROM AGE(NOW(), coalesce(birthday, NOW())))::int) as members_age`
        ),
        Database.raw(
          `(CASE WHEN (SUM(CASE WHEN child IS TRUE THEN 0 ELSE 1 END)) = 0 THEN NULL
             ELSE
               SUM(CASE WHEN child IS TRUE THEN 0 ELSE COALESCE(credit_score, 0) END) /
               SUM(CASE WHEN child IS TRUE THEN 0 ELSE 1 END)
             END) AS credit_score`
        ),
        Database.raw(
          `
          CASE WHEN SUM(CASE WHEN child IS TRUE THEN 1 ELSE 0 END) > 0 THEN ?
            WHEN SUM(CASE WHEN child IS TRUE THEN 0 ELSE 1 END) < 2 THEN ?
            ELSE ? END AS family_status
        `,
          [FAMILY_STATUS_WITH_CHILD, FAMILY_STATUS_SINGLE, FAMILY_STATUS_NO_CHILD]
        )
      )
      .where({ user_id: userId })
      .groupBy('user_id')

    const toUpdate = isEmpty(tenantData)
      ? {
          family_status: FAMILY_STATUS_SINGLE,
          minors_count: 0,
          members_count: 0,
          unpaid_rental: null,
          insolvency_proceed: null,
          arrest_warranty: null,
          clean_procedure: null,
          income_seizure: null,
          members_age: null,
          credit_score: 0,
        }
      : tenantData[0]

    await Tenant.query()
      .update({
        ...toUpdate,
        credit_score: parseInt(toUpdate.credit_score) || null,
      })
      .where({ user_id: userId })
  }

  /**
   *
   */
  static async createMember(member, user_id) {
    return Member.createItem({ ...member, user_id })
  }

  /**
   *
   */
  static getMemberQuery() {
    return Member.query()
  }

  /**
   *
   */
  static async addIncome(data, member) {
    return Income.createItem({
      ...data,
      member_id: member.id,
    })
  }

  /**
   *
   */
  static async getIncomeByIdAndUser(id, user) {
    return Income.query()
      .where('id', id)
      .whereIn('member_id', function () {
        this.select('id').from('members').where('user_id', user.id)
      })
      .first()
  }

  /**
   *
   */
  static async addMemberIncomeProof(data, income) {
    return IncomeProof.createItem({
      ...data,
      income_id: income.id,
    })
  }

  /**
   *
   */
  static async updateUserIncome(userId) {
    await Database.raw(
      `
      UPDATE tenants SET income = (
        SELECT COALESCE(SUM(coalesce(income, 0)), 0)
          FROM members as _m
            INNER JOIN incomes as _i ON _i.member_id = _m.id
          WHERE user_id = ?
      ) WHERE user_id = ?
    `,
      [userId, userId]
    )
  }

  static async sendInvitationCode(id, userId) {

    const trx = await Database.beginTransaction()    
    try{
      const member = await Member.findByOrFail({ id:id, user_id:userId })
      const code = getHash(3)
      //const user = await User.query().select('email').where('id', userId).firstOrFail()
      if( member && member.email ){
        await Member.query()
        .where({ id: id })
        .update({
          code: code,
          published_at: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
        }, trx)
   
        const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEB_KEY)        
        const { shortLink } = await firebaseDynamicLinks.createLink({
          dynamicLinkInfo: {
            domainUriPrefix: process.env.DOMAIN_PREFIX,
            link: `${process.env.DEEP_LINK}?type=memberinvitation&email=${member.email}&code=${code}`,
            androidInfo: {
              androidPackageName: process.env.ANDROID_PACKAGE_NAME,
            },
            iosInfo: {
              iosBundleId: process.env.IOS_BUNDLE_ID,
            },
          },
        })

        await MailService.sendcodeForMemberInvitation(member.email, shortLink)    
        trx.commit()
        return true
      }
      if( member && !member.email ) {
        throw new HttpException('this member doesn\'t have email. please add email first', 400 )
      }
      return false

    }catch(e){
console.log('Send Invitation code', e )      
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }   
  }

  static async getInvitationCode(email,code) {
    const member = await Member.query()
      .select(['id', 'user_id'])
      .where('email', email)
      .where('code', code).firstOrFail()
    await Member.query()
        .where({ id: member.id, user_id:member.user_id })
        .update({
          is_verified: true,
          published_at: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
        })
    return member
  }
}

module.exports = MemberService
