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
  ROLE_HOUSEKEEPER,
  ROLE_USER,
} = require('../constants')
const HttpException = require('../Exceptions/HttpException.js')

class MemberService {
  /**
   *
   */

  static async getMemberIdsByOwnerId(owner_id, role) {
    try {
      const member = await Member.query().select('id').where('owner_user_id', owner_id).first()

      if (!member) {
        if (role === ROLE_HOUSEKEEPER) {
          throw new HttpException('You are not the member anymore', 400)
        }

        //Default: the first member for specific user will be household because he doesn't set his member as owner_user_id

        const members = await Member.query()
          .select('id')
          .where('user_id', owner_id)
          .orderBy('id', 'asc')
          .fetch()

        if (!members) {
          throw new HttpException('No member exists', 400)
        }

        return members.toJSON().map((m) => m.id)
      }
      return [member.id]
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  static async getMemberIdByOwnerId(owner_id, role) {
    //owner_user_id means you only can see your profile, not visible to household and the others
    let member = await Member.query().select('id').where('owner_user_id', owner_id).first()

    if (!member) {
      if (role === ROLE_HOUSEKEEPER) {
        throw new HttpException('You are not the member anymore', 400)
      }

      //Default: the first member for specific user will be household because he doesn't set his member as owner_user_id
      member = await Member.query()
        .select('id')
        .where('user_id', owner_id)
        .orderBy('id', 'asc')
        .first()

      if (!member) {
        throw new HttpException('No member exists', 400)
      }
    }
    return member.id
  }

  static async getMembers(householdId) {
    const query = Member.query()
      .select('members.*')
      .where('members.user_id', householdId)
      .with('incomes', function (b) {
        b.with('proofs')
      })
      .orderBy('id', 'asc')

    return await query.fetch()
  }

  /**
   * Get all tenant members and calculate general tenant params
   */
  static async calcTenantMemberData(userId, trx = null) {
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
      .update(
        {
          ...toUpdate,
          credit_score: parseInt(toUpdate.credit_score) || null,
        },
        trx
      )
      .where({ user_id: userId })
  }

  /**
   *
   */
  static async createMember(member, user_id, trx) {
    return Member.createItem({ ...member, user_id }, trx)
  }

  static async setMemberOwner(member_id, owner_id) {
    if (member_id == null) {
      return
    }
    await Member.query()
      .update({
        owner_user_id: owner_id,
      })
      .where({ id: member_id })
  }

  static async getMember(id, user_id, role) {
    let member
    if (role === ROLE_USER) {
      member = await Member.query()
        .where('id', id)
        .whereNull('owner_user_id')
        .where('user_id', user_id)
        .first()
    } else {
      member = await Member.query().where('id', id).where('owner_user_id', user_id).first()
    }
    return member
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
    const memberIds = await this.getMemberIdsByOwnerId(user.id, user.role)
    console.log('MemberId', memberIds)
    return Income.query().where('id', id).whereIn('member_id', memberIds).first()
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
    try {
      const member = await Member.findByOrFail({ id: id, user_id: userId })
      const code = getHash(3)
      //const user = await User.query().select('email').where('id', userId).firstOrFail()
      if (member && member.email) {
        await Member.query()
          .where({ id: id })
          .update(
            {
              code: code,
              published_at: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
            },
            trx
          )

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
      if (member && !member.email) {
        throw new HttpException("this member doesn't have email. please add email first", 400)
      }
      return false
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  static async getInvitationCode(email, code) {
    const member = await Member.query()
      .select(['id', 'user_id'])
      .where('email', email)
      .where('code', code)
      .firstOrFail()

    await Member.query()
      .where({ id: member.id, user_id: member.user_id })
      .update({
        is_verified: true,
        published_at: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      })
    return member
  }

  /**
   *
   */
  static async getIncomeProofs() {
    console.log('income__Proofs__incomeProofs1income__Proofs__incomeProofs1:')
    const startOf = moment().subtract(4, 'months').format('YYYY-MM-DD');
    console.log('startOfstartOf:', startOf)
    return IncomeProof.query()
      .where('expire_date', '<=', startOf).delete()
  }
}

module.exports = MemberService
