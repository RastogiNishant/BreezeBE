const Event = use('Event')
const Database = use('Database')
const Member = use('App/Models/Member')
const Tenant = use('App/Models/Tenant')
const User = use('App/Models/User')
const Income = use('App/Models/Income')
const IncomeProof = use('App/Models/IncomeProof')
const { getHash } = require('../Libs/utils.js')
const { isEmpty, pick } = require('lodash')
const moment = require('moment')
const MailService = use('App/Services/MailService')
const { FirebaseDynamicLinks } = use('firebase-dynamic-links')
const random = require('random')
const DataStorage = use('DataStorage')
const SMSService = use('App/Services/SMSService')
const MemberPermissionService = use('App/Services/MemberPermissionService')
const NoticeService = use('App/Services/NoticeService')
const UserService = use('App/Services/UserService')
const File = use('App/Classes/File')
const l = use('Localize')
const Promise = require('bluebird')

const {
  FAMILY_STATUS_NO_CHILD,
  FAMILY_STATUS_SINGLE,
  FAMILY_STATUS_WITH_CHILD,
  SMS_MEMBER_PHONE_VERIFY_PREFIX,
  ROLE_USER,
  VISIBLE_TO_SPECIFIC,
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

  static async getMemberIdByOwnerId(user) {
    const memberConditions = {}
    if (user.owner_id) {
      memberConditions.owner_user_id = user.id
      memberConditions.user_id = user.owner_id
      memberConditions.email = user.email
    } else {
      memberConditions.user_id = user.id
      memberConditions.email = null
      memberConditions.owner_user_id = null
    }
    const member = await Member.query().where(memberConditions).firstOrFail()
    return member.id
  }

  static async limitMemberDataByPermission(user, members) {
    const myMemberId = await this.getMemberIdByOwnerId(user)
    const memberPermissions = (await MemberPermissionService.getMemberPermission(myMemberId)).rows
    let userIds = memberPermissions ? memberPermissions.map((mp) => mp.user_id) : []
    userIds.push(user.id)

    members = members.map((member) => {
      const hasPermission = member.owner_user_id
        ? userIds.includes(member.owner_user_id)
        : userIds.includes(member.user_id)
      return hasPermission ? member : pick(member.toJSON(), Member.limitFieldsList)
    })

    return members
  }

  static async getMembers(householdId) {
    const query = Member.query()
      .select('members.*')
      .where('members.user_id', householdId)
      .with('incomes', function (b) {
        b.with('proofs')
      })
      .with('passports')
      .orderBy('id', 'asc')

    return await query.fetch()
  }

  static async getMembersByHousehold(householdId) {
    return (
      await Member.query().select('user_id', 'owner_user_id').where('user_id', householdId).fetch()
    ).rows
  }

  /**
   * Get all tenant members and calculate general tenant params
   */
  static async calcTenantMemberData(userId, trx = null) {
    const members = await this.getMembersByHousehold(userId)
    if (!members || !members.length) {
      return
    }

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

    await Promise.map(members, async (member) => {
      const tenant = await Tenant.query().where({ user_id: member.owner_user_id || member.user_id }).first()

      if (tenant && tenant.length) {
        const { members_count, credit_score } = tenantData[0]

        const family_status =
          tenant.minors_count > 0
            ? FAMILY_STATUS_WITH_CHILD
            : members_count < 2
            ? FAMILY_STATUS_SINGLE
            : FAMILY_STATUS_NO_CHILD

        await Tenant.query()
          .update(
            {
              members_count: members_count,
              family_status: family_status,
              credit_score: parseInt(credit_score) || null,
            },
            trx
          )
          .where({ user_id: member.owner_user_id || member.user_id })
      }
    })
  }

  static async sendSMS(memberId, phone, lang = 'en') {
    const code = random.int(1000, 9999)
    try {
      const member = await Member.query().select('*').where('id', memberId).first()

      if (!member) {
        throw new HttpException('No member exists', 400)
      }
      await DataStorage.setItem(
        memberId,
        { code: code, count: 5 },
        SMS_MEMBER_PHONE_VERIFY_PREFIX,
        {
          ttl: 3600,
        }
      )

      const data = await UserService.getTokenWithLocale([member.owner_user_id || member.user_id])
      const lang = data && data.length && data[0].lang ? data[0].lang : 'en'
      const txt = l.get('landlord.email_verification.subject.message', lang) + ` ${code}`

      await SMSService.send({ to: phone, txt })
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
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
    if (member_id == null) {
      return
    }
    await Member.query().update({ owner_user_id: owner_id }).where({ id: member_id })
  }

  static async getMember(id, user_id, owner_id) {
    let member
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

  static async allowEditMemberByPermission(user, memberId) {
    const member = await Member.query().where('id', memberId).with('passports').firstOrFail()
    const isEditingOwnMember = user.owner_id
      ? member.owner_user_id === user.id
      : member.user_id === user.id

    if (isEditingOwnMember) {
      return member
    } else {
      const myMemberId = await this.getMemberIdByOwnerId(user)
      const permission = await MemberPermissionService.isExistPermission(
        myMemberId,
        member.owner_user_id ?? member.user_id
      )
      if (!permission) {
        throw new HttpException('Member not exists or permission denied', 400)
      }
      return member
    }
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
  static async addIncome(data, member, trx = null) {
    return Income.createItem(
      {
        ...data,
        member_id: member.id,
      },
      trx
    )
  }

  /**
   *
   */
  static async getIncomeByIdAndUser(id, user) {
    const income = await Income.query().where('id', id).first()
    const member = await MemberService.allowEditMemberByPermission(user, income.member_id)
    if (member) {
      return income
    }
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
   * user will be prospect
   */
  static async updateUserIncome(userId, sUserId, trx) {
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
    ).transacting(trx)

    if (sUserId) {
      await Database.raw(
        `
        UPDATE tenants SET income = (
          SELECT COALESCE(SUM(coalesce(income, 0)), 0)
            FROM members as _m
              INNER JOIN incomes as _i ON _i.member_id = _m.id
            WHERE owner_user_id = ?
        ) WHERE user_id = ?
      `,
        [sUserId, sUserId]
      ).transacting(trx)
    }
  }

  static async sendInvitationCode(id, userId) {
    const trx = await Database.beginTransaction()
    try {
      const member = await Member.findByOrFail({ id: id, user_id: userId })
      const code = getHash(3)
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

        const invitedUser = await User.query()
          .where({ email: member.email, role: ROLE_USER })
          .first()
        if (invitedUser) {
          invitedUser.is_household_invitation_onboarded = false
          invitedUser.is_profile_onboarded = true
          await invitedUser.save(trx)
        }

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
      } else {
        if (member && !member.email) {
          throw new HttpException("this member doesn't have email. please add email first", 400)
        } else {
          await trx.rollback()
        }
      }
      return false
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  static async mergeTenantAccounts(user, visibility_to_other) {
    const trx = await Database.beginTransaction()
    try {
      const member = await Member.query()
        .select(['id', 'user_id'])
        .where('email', user.email)
        .where('is_verified', false)
        .whereNotNull('code')
        .firstOrFail()

      const updatePromises = []

      const invitorUserId = member.user_id

      // Update invited user owner id
      user.owner_id = invitorUserId
      user.is_household_invitation_onboarded = true
      updatePromises.push(user.save(trx))

      let invitedMemberId = member.id

      const existingTenantMembersQuery = await Member.query().where('user_id', user.id).fetch()
      const existingTenantMembers = existingTenantMembersQuery.rows
      if (existingTenantMembers.length > 0) {
        // Current owner member is won't be owner anymore because invited by another owner
        const ownerMember = existingTenantMembers.find(
          ({ owner_user_id, email }) => !owner_user_id && !email
        )
        if (ownerMember) {
          invitedMemberId = ownerMember.id
          ownerMember.owner_user_id = user.id
          ownerMember.email = user.email
          updatePromises.push(ownerMember.save(trx))
        }
        // Update invited user's already existing members' user ids
        existingTenantMembers.map((existingMember) => {
          existingMember.user_id = invitorUserId
          updatePromises.push(existingMember.save(trx))
        })
        // Update invited user's already existing members' users' owners
        const existingMembersOwners = []
        existingTenantMembers.map(({ owner_user_id }) =>
          owner_user_id && owner_user_id !== user.id
            ? existingMembersOwners.push(owner_user_id)
            : null
        )
        await User.query()
          .whereIn('id', existingMembersOwners)
          .update({ owner_id: member.user_id }, trx)

        // Delete member that created for invitation
        // Because this function is for already registered users and
        // Already registered user has a member already, so we don't need this automatically created member
        const existingPermission = await MemberPermissionService.isExistPermission(
          member.id,
          invitorUserId
        )
        if (existingPermission) {
          await MemberPermissionService.deletePermission(member.id, trx)
          Event.fire('memberPermission:create', invitedMemberId, invitorUserId)
        }
        await member.delete(trx)
      } else {
        member.is_verified = true
        member.owner_user_id = user.id
        member.email = user.email
        updatePromises.push(member.save(trx))
      }

      updatePromises.push(this.calcTenantMemberData(invitorUserId, trx))

      await Promise.all(updatePromises)
      if (visibility_to_other === VISIBLE_TO_SPECIFIC) {
        const invitorMember = await Member.query()
          .where({
            user_id: invitorUserId,
            email: null,
            owner_user_id: null,
          })
          .first()
        if (invitorMember) {
          Event.fire('memberPermission:create', invitorMember.id, user.id)
        }
      }
      await trx.commit()
      await NoticeService.prospectHouseholdInvitationAccepted(invitorUserId)
      return true
    } catch (e) {
      console.log({ e })
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  static async refuseHouseholdInvitation(user) {
    const trx = await Database.beginTransaction()
    try {
      const member = await Member.query()
        .select(['id', 'user_id'])
        .where('email', user.email)
        .where('is_verified', false)
        .whereNotNull('code')
        .firstOrFail()

      const updatePromises = []
      const invitorUserId = member.user_id

      user.owner_id = null
      user.is_household_invitation_onboarded = true

      updatePromises.push(user.save(trx))

      const userMainMember = await Member.query()
        .where({
          user_id: user.id,
          email: null,
          owner_user_id: null,
        })
        .first()

      if (userMainMember) {
        updatePromises.push(Member.query().where('id', member.id).delete(trx))
      } else {
        member.user_id = user.id
        member.email = null
        member.owner_user_id = null
        member.is_verified = true
        member.code = null
        updatePromises.push(member.save(trx))
      }

      const existingPermission = await MemberPermissionService.isExistPermission(
        member.id,
        invitorUserId
      )
      if (existingPermission) {
        await MemberPermissionService.deletePermission(member.id, trx)
      }

      await Promise.all(updatePromises)
      await this.calcTenantMemberData(invitorUserId, trx)
      await this.calcTenantMemberData(user.id, trx)
      await trx.commit()
      return true
    } catch (e) {
      console.log({ e })
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

  static async createThumbnail() {
    const incomeProofs = (await IncomeProof.query().fetch()).rows
    console.log('Start creating income proofs thumbnail')
    await Promise.all(
      incomeProofs.map(async (incomeProof) => {
        {
          try {
            const url = await File.getProtectedUrl(incomeProof.file)
            if (incomeProof.file) {
              const url_strs = incomeProof.file.split('/')
              if (url_strs.length === 2) {
                const fileName = url_strs[1]
                const isValidFormat = File.SUPPORTED_IMAGE_FORMAT.some((format) => {
                  return fileName.includes(format)
                })

                if (isValidFormat) {
                  const mime = File.SUPPORTED_IMAGE_FORMAT.find((mt) => fileName.includes(mt))
                  const options = { ContentType: File.IMAGE_MIME_TYPE[mime] }

                  console.log('Income Proof is saving', url)
                  await File.saveThumbnailToDisk({
                    image: url,
                    fileName: fileName,
                    dir: `${url_strs[0]}`,
                    options,
                    disk: 's3',
                    isUri: true,
                  })
                  console.log('Income Proof saved', url)
                }
              }
            }
          } catch (e) {
            console.log('Creating thumbnail Error', e)
            throw new HttpException('Creating thumbnail HttpException Error', e)
          }
        }
      })
    )

    console.log('End creating income proofs thumbnail')
  }
}

module.exports = MemberService
