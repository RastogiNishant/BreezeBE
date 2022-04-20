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
const random = require('random')
const DataStorage = use('DataStorage')
const SMSService = use('App/Services/SMSService')

const {
  FAMILY_STATUS_NO_CHILD,
  FAMILY_STATUS_SINGLE,
  FAMILY_STATUS_WITH_CHILD,
  SMS_MEMBER_PHONE_VERIFY_PREFIX,
} = require('../constants')
const HttpException = require('../Exceptions/HttpException.js')

class MemberService {
  /**
   *
   */

  static async getMemberIdsByOwnerId(owner_id, hasOwnerId) {
    try {
      const member = await Member.query().select('id').where('owner_user_id', owner_id).first()

      //TODO: check
      if (!member) {
        if (hasOwnerId) {
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

  static async getMemberIdByOwnerId(owner_id, hasOwnerId) {
    //owner_user_id means you only can see your profile, not visible to household and the others
    let member = await Member.query().select('id').where('owner_user_id', owner_id).first()

    //TODO: check
    if (!member) {
      if (hasOwnerId) {
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
        Database.raw(`COUNT(*) AS members_count`),
        Database.raw(
          `ARRAY_AGG(EXTRACT(YEAR FROM AGE(NOW(), coalesce(birthday, NOW())))::int) as members_age`
        ),
        Database.raw(
          `(CASE WHEN (COUNT(*)) = 0 THEN NULL
             ELSE
               SUM(COALESCE(credit_score, 0)) /
               COUNT(*)
             END) AS credit_score`
        )
      )
      .where({ user_id: userId })
      .groupBy('user_id')

    let toUpdate = {}
    if (isEmpty(tenantData)) {
      toUpdate = {
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
    } else {
      const { minors_count } = await Tenant.query()
        .select('minors_count')
        .where({ user_id: userId })
        .firstOrFail()
      const { members_count } = tenantData[0]

      toUpdate.family_status =
        minors_count > 0
          ? FAMILY_STATUS_WITH_CHILD
          : members_count < 2
          ? FAMILY_STATUS_SINGLE
          : FAMILY_STATUS_NO_CHILD
    }

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

  static async sendSMS(memberId, phone) {
    const code = random.int(1000, 9999)
    await DataStorage.setItem(memberId, { code: code, count: 5 }, SMS_MEMBER_PHONE_VERIFY_PREFIX, {
      ttl: 3600,
    })
    await SMSService.send(phone, code)
  }

  static async confirmSMS(memberId, phone, code) {
    const member = await Member.query()
      .select('id')
      .where('id', memberId)
      .where('phone', phone)
      .firstOrFail()

    const data = await DataStorage.getItem(memberId, SMS_MEMBER_PHONE_VERIFY_PREFIX)

    if (!data) {
      throw new HttpException('No code', 400)
    }

    if (parseInt(data.code) !== parseInt(code)) {
      await DataStorage.remove(user.id, SMS_MEMBER_PHONE_VERIFY_PREFIX)

      if (parseInt(data.count) <= 0) {
        throw new HttpException('Your code invalid any more', 400)
      }

      await DataStorage.setItem(
        memberId,
        { code: data.code, count: parseInt(data.count) - 1 },
        SMS_MEMBER_PHONE_VERIFY_PREFIX,
        { ttl: 3600 }
      )
      throw new HttpException('Not Correct', 400)
    }

    await Member.query().where({ id: memberId }).update({
      phone_verified: true,
    })

    await DataStorage.remove(memberId, SMS_MEMBER_PHONE_VERIFY_PREFIX)
    return true
  }
  /**
   *
   */
  static async createMember(member, user_id, trx) {
    return Member.createItem({ ...member, user_id }, trx)
  }

  static async setMemberOwner(member_id, owner_id) {
    console.log({ member_id, owner_id })
    if (member_id == null) {
      return
    }
    await Member.query()
      .update({
        owner_user_id: owner_id,
      })
      .where({ id: member_id })
  }

  static async getMember(id, user_id, owner_id) {
    let member
    console.log({ user_id, owner_id })
    if (!owner_id) {
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
    const memberIds = await this.getMemberIdsByOwnerId(user.id, user.owner_id)
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

  static async getInvitationCode(email, code, user) {
    const trx = await Database.beginTransaction()
    try {
      const member = await Member.query()
        .select(['id', 'user_id'])
        .where('email', email)
        .where('code', code)
        .firstOrFail()

      const updatePromises = []

      user.owner_id = member.user_id
      updatePromises.push(user.save(trx))

      const existingTenantMembers = await Member.query().where('user_id', user.id).fetch().rows

      for (let i = 0; i < existingTenantMembers.length; i++) {
        const existingTenantMember = existingTenantMembers[i]
        existingTenantMember.user_id = member.user_id
        existingTenantMember.owner_user_id = user.id
        existingTenantMember.is_verified = true
        updatePromises.push(existingTenantMember.save(trx))
      }

      updatePromises.push(member.delete(trx))

      await Promise.all(updatePromises)
      await trx.commit()
      return true
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  static async getIncomeProofs() {
    const startOf = moment().subtract(4, 'months').format('YYYY-MM-DD')
    return IncomeProof.query().where('expire_date', '<=', startOf).delete()
  }
}

module.exports = MemberService
