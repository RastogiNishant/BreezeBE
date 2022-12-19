const Event = use('Event')
const Database = use('Database')
const Member = use('App/Models/Member')
const Tenant = use('App/Models/Tenant')
const User = use('App/Models/User')
const Income = use('App/Models/Income')
const MemberFile = use('App/Models/MemberFile')
const IncomeProof = use('App/Models/IncomeProof')
const { getHash } = require('../Libs/utils.js')
const { pick } = require('lodash')
const moment = require('moment')
const MailService = use('App/Services/MailService')
const { FirebaseDynamicLinks } = use('firebase-dynamic-links')
const random = require('random')
const DataStorage = use('DataStorage')
const SMSService = use('App/Services/SMSService')
const MemberPermissionService = use('App/Services/MemberPermissionService')
const NoticeService = use('App/Services/NoticeService')
const File = use('App/Classes/File')
const FileBucket = use('App/Classes/File')
const l = use('Localize')
const Promise = require('bluebird')
const docMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG, File.IMAGE_PDF]

const {
  FAMILY_STATUS_NO_CHILD,
  FAMILY_STATUS_SINGLE,
  FAMILY_STATUS_WITH_CHILD,
  SMS_MEMBER_PHONE_VERIFY_PREFIX,
  ROLE_USER,
  VISIBLE_TO_SPECIFIC,
  MEMBER_FILE_EXTRA_RENT_ARREARS_DOC,
  MEMBER_FILE_EXTRA_DEBT_PROOFS_DOC,
  MEMBER_FILE_PASSPORT_DOC,
  MEMBER_FILE_TYPE_EXTRA_RENT,
  MEMBER_FILE_TYPE_EXTRA_DEBT,
  STATUS_ACTIVE,
  MEMBER_FILE_TYPE_EXTRA_PASSPORT,
  MEMBER_FILE_EXTRA_PASSPORT_DOC,
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

  static async getMembers(householdId, includes_absolute_url = false) {
    const query = Member.query()
      .select('members.*')
      .where('members.user_id', householdId)
      .with('incomes', function (b) {
        b.with('proofs')
      })
      .with('passports')
      .with('extra_passports')
      .with('extra_residency_proofs')
      .with('extra_score_proofs')
      .orderBy('id', 'asc')

    if (!includes_absolute_url) {
      return await query.fetch()
    } else {
      let members = await query.fetch()

      members = await Promise.all(
        members.toJSON().map(async (member) => {
          const incomes = await Promise.all(
            member.incomes.map(async (income) => {
              const proofs = await Promise.all(
                income.proofs.map(async (proof) => {
                  if (!proof.file) return proof
                  proof.file = await FileBucket.getProtectedUrl(proof.file)
                  return proof
                })
              )
              income = {
                ...income,
                proofs: proofs,
              }
              return income
            })
          )

          const passports = await Promise.all(
            (member.passports || []).map(async (passport) => {
              if (!passport.file) return passport
              passport.file = await FileBucket.getProtectedUrl(passport.file)
              return passport
            })
          )

          const extra_passports = await Promise.all(
            (member.extra_passports || []).map(async (extra_passport) => {
              if (!extra_passport.file) return extra_passport
              extra_passport.file = await FileBucket.getProtectedUrl(extra_passport.file)
              return extra_passport
            })
          )

          const extra_residency_proofs = await Promise.all(
            (member.extra_residency_proofs || []).map(async (extra_residency_proof) => {
              if (!extra_residency_proof.file) return extra_residency_proof
              extra_residency_proof.file = await FileBucket.getProtectedUrl(
                extra_residency_proof.file
              )
              return extra_residency_proof
            })
          )

          const extra_score_proofs = await Promise.all(
            (member.extra_score_proofs || []).map(async (extra_score_proof) => {
              if (!extra_score_proof.file) return extra_score_proof
              extra_score_proof.file = await FileBucket.getProtectedUrl(extra_score_proof.file)
              return extra_score_proof
            })
          )

          member = {
            ...member,
            rent_arrears_doc: await FileBucket.getProtectedUrl(member.rent_arrears_doc),
            debt_proof: await FileBucket.getProtectedUrl(member.debt_proof),
            incomes,
            extra_passports,
            passports,
            extra_residency_proofs,
            extra_score_proofs,
          }
          return member
        })
      )
      return members
    }
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
    const shouldTrxProceed = trx !== null
    if (!trx) trx = await Database.beginTransaction()

    try {
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

      const householdTenant = await Tenant.query().where({ user_id: userId }).first()

      const { members_count, credit_score } = tenantData[0] // calculated data
      const { minors_count, private_use, pets, pets_species, parking_space, status } =
        householdTenant // data to sync with all the tenants of all the members

      await Promise.map(members, async (member) => {
        const tenant = await Tenant.query()
          .where({ user_id: member.owner_user_id || member.user_id })
          .first()

        if (tenant) {
          const family_status =
            minors_count > 0
              ? FAMILY_STATUS_WITH_CHILD
              : members_count < 2
              ? FAMILY_STATUS_SINGLE
              : FAMILY_STATUS_NO_CHILD

          const updatingFields = {
            members_count,
            family_status,
            credit_score: parseInt(credit_score) || null,
          }

          // sync secondary member's tenant
          if (member.owner_user_id) {
            updatingFields.private_use = private_use
            updatingFields.pets = pets
            updatingFields.pets_species = pets_species
            updatingFields.parking_space = parking_space
            updatingFields.minors_count = minors_count
            updatingFields.status = status
          }

          await Tenant.query()
            .update(updatingFields, trx)
            .where({ user_id: member.owner_user_id || member.user_id })
        }
      })

      await MemberService.updateTenantIncome(userId, trx)
      if (!shouldTrxProceed) await trx.commit()
    } catch (e) {
      if (!shouldTrxProceed) {
        await trx.rollback()
      }
      throw e
    }
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

      const data = await require('./UserService').getTokenWithLocale([
        member.owner_user_id || member.user_id,
      ])
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
      const query = Member.query().whereNull('owner_user_id').where('user_id', user_id)
      if (id) query.where('id', id)
      member = await query.first()
    } else {
      member = await Member.query().where('id', id).where('owner_user_id', user_id).first()
    }
    return member
  }

  static async allowEditMemberByPermission(user, memberId) {
    const member = await this.getMemberWithPassport(memberId)
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

  static async getMemberWithPassport(memberId) {
    const member = await Member.query().where('id', memberId).with('passports').firstOrFail()
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
  static async updateTenantIncome(userId, trx) {
    // family: member1, member2, member3
    // we should sync all of them income with the same count
    // it should be the sum up of all the members all the incomes

    const members = await this.getMembersByHousehold(userId)
    if (!members || !members.length) {
      return
    }

    const ids = members.map((member) => member.owner_user_id || member.user_id)

    await Database.raw(
      `
        UPDATE tenants SET income = (
          SELECT COALESCE(SUM(coalesce(income, 0)), 0)
            FROM members as _m
              INNER JOIN incomes as _i ON _i.member_id = _m.id
            WHERE user_id = ${userId}
        ) WHERE user_id in (${ids})
      `
    ).transacting(trx)
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
              iosAppStoreId: process.env.IOS_APPSTORE_ID,
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
        member.code = null
        updatePromises.push(member.save(trx))
      }

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
      Event.fire('tenant::update', invitorUserId)
      Event.fire('tenant::update', user.id)
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
      await trx.commit()
      Event.fire('tenant::update', invitorUserId)
      Event.fire('tenant::update', user.id)
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
  static async handleOutdatedIncomeProofs() {
    const startOf = moment().utc().subtract(4, 'months').format('YYYY-MM-DD')
    const incomeProofs = await IncomeProof.query()
      .select('income_proofs.*')
      .where('income_proofs.expire_date', '<=', startOf)
      .innerJoin({ _i: 'incomes' }, '_i.id', 'income_proofs.income_id')
      .innerJoin({ _m: 'members' }, '_m.id', '_i.member_id')
      .select('_m.user_id')
      .fetch()

    const promises = []
    const deactivatedUsers = []

    incomeProofs.rows.map(({ user_id, id }) => {
      promises.push(IncomeProof.query().where('id', id).delete())
      if (!deactivatedUsers.includes(user_id)) {
        Event.fire('tenant::update', user_id)
        NoticeService.prospectAccountDeactivated(user_id)
        deactivatedUsers.push(user_id)
      }
    })

    return await Promise.all(promises)
  }

  static async createThumbnail() {
    const incomeProofs = (await IncomeProof.query().fetch()).rows

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
  }

  static async addExtraProofs(request, user) {
    const { id, file_type } = request.all()

    const member = await this.allowEditMemberByPermission(user, id)
    if (!member) {
      throw new HttpException('No permission to add passport')
    }

    let doc = ''

    switch (file_type) {
      case MEMBER_FILE_TYPE_EXTRA_RENT:
        doc = MEMBER_FILE_EXTRA_RENT_ARREARS_DOC
        break
      case MEMBER_FILE_TYPE_EXTRA_DEBT:
        doc = MEMBER_FILE_EXTRA_DEBT_PROOFS_DOC
        break
      case MEMBER_FILE_TYPE_EXTRA_PASSPORT:
        doc = MEMBER_FILE_EXTRA_PASSPORT_DOC
        break
      default:
        doc = MEMBER_FILE_PASSPORT_DOC
        break
    }

    const files = await File.saveRequestFiles(request, [
      { field: doc, mime: docMimes, isPublic: false },
    ])

    if (!files[doc]) {
      throw new HttpException('Failure uploading image', 422)
    }

    let memberFile = new MemberFile()
    memberFile.merge({
      file: files[doc],
      type: file_type,
      status: STATUS_ACTIVE,
      member_id: id,
    })
    return await memberFile.save()
  }
}

module.exports = MemberService
