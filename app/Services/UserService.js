'use strict'

const { FirebaseDynamicLinks } = use('firebase-dynamic-links')
const uuid = require('uuid')
const moment = require('moment')
const { isArray, isEmpty, uniq, pick, trim, omit } = require('lodash')
const Promise = require('bluebird')
const fs = require('fs')
const Env = use('Env')
const Database = use('Database')
const DataStorage = use('DataStorage')
const User = use('App/Models/User')
const Tenant = use('App/Models/Tenant')
const Buddy = use('App/Models/Buddy')
const Member = use('App/Models/Member')
const Term = use('App/Models/Term')
const Income = use('App/Models/Income')
const Agreement = use('App/Models/Agreement')
const MailService = use('App/Services/MailService')
const AppException = use('App/Exceptions/AppException')
const HttpException = use('App/Exceptions/HttpException')
const SMSService = use('App/Services/SMSService')
const Event = use('Event')
const Logger = use('Logger')
const l = use('Localize')
const MemberService = use('App/Services/MemberService')
const { getHash, encodeURL } = require('../Libs/utils.js')
const random = require('random')
const Drive = use('Drive')
const Hash = use('Hash')
const Config = use('Config')
const GoogleAuth = use('GoogleAuth')
const { getIpBasedInfo } = use('App/Libs/getIpBasedInfo')
const Admin = use('App/Models/Admin')
const WebSocket = use('App/Classes/Websocket')
const {
  STATUS_EMAIL_VERIFY,
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  ROLE_USER,
  ROLE_LANDLORD,
  ROLE_PROPERTY_MANAGER,
  MATCH_STATUS_FINISH,
  DATE_FORMAT,
  BUDDY_STATUS_ACCEPTED,
  SMS_VERIFY_PREFIX,
  LOG_TYPE_SIGN_UP,
  DEFAULT_LANG,
  SIGN_IN_METHOD_GOOGLE,
  USER_ACTIVATION_STATUS_ACTIVATED,
  PASS_ONBOARDING_STEP_COMPANY,
  PASS_ONBOARDING_STEP_PREFERRED_SERVICES,
  ERROR_USER_NOT_VERIFIED_LOGIN,
  TEST_ENVIRONMENT,
  STATUS_DELETE,
  WRONG_INVITATION_LINK,
  WEBSOCKET_EVENT_USER_ACTIVATE,
  SET_EMPTY_IP_BASED_USER_INFO_ON_LOGIN,
  OUTSIDE_LANDLORD_INVITE_TYPE,
  OUTSIDE_PROSPECT_KNOCK_INVITE_TYPE,
  OUTSIDE_TENANT_INVITE_TYPE,
  ACCOUNT_CREATION_EMAIL_NOTIFICATION_RECIPIENTS,
  LANDLORD_ACCOUNT_CREATION_EMAIL_NOTIFICATION_SUBJECT,
  PETS_NO,
  PETS_SMALL,
  TEMPORARY_PASSWORD_PREFIX
} = require('../constants')

const {
  exceptions: {
    USER_UNIQUE,
    INVALID_CONFIRM_CODE,
    NOT_EXIST_WITH_EMAIL,
    USER_NOT_EXIST,
    MEMBER_NOT_EXIST,
    HOUSEHOLD_NOT_EXIST,
    SMS_CODE_NOT_VALID,
    SMS_CODE_NOT_CORERECT,
    INVALID_USER_ROLE,
    USER_NOT_VERIFIED,
    CURRENT_PASSWORD_NOT_VERIFIED,
    FAILED_GET_OWNER,
    NO_USER_PASSED,
    NO_CODE_PASSED,
    INVALID_TOKEN,
    ACCOUNT_ALREADY_VERIFIED,
    NO_CONTACT_EXIST
  }
} = require('../../app/exceptions')

const { logEvent } = require('./TrackingService.js')

class UserService {
  /**
   * Create user flow
   */
  static async createUser(userData, trx = null) {
    // we need him to approve Terms and Privacy
    const latestTerm = await Term.query()
      .where('status', STATUS_ACTIVE)
      .orderBy('id', 'desc')
      .first()
    const latestAgreement = await Agreement.query()
      .where('status', STATUS_ACTIVE)
      .orderBy('id', 'desc')
      .first()
    userData.terms_id = latestTerm.id
    userData.agreements_id = latestAgreement.id

    let isExist = true
    let code = ''
    while (isExist) {
      code = User.getTenDigitCode()
      const userByCode = await User.query().where('code', code).first()
      if (!userByCode) {
        userData.code = code
        isExist = false
      }
    }
    // Manages the outside tenant invitation flow
    if (
      !userData?.source_estate_id &&
      userData?.invite_type === OUTSIDE_TENANT_INVITE_TYPE &&
      userData?.data1 &&
      userData?.data2
    ) {
      const { estate_id } = await require('./EstateCurrentTenantService').handleInvitationLink({
        data1: userData.data1,
        data2: userData.data2,
        email: userData.email
      })
      userData.source_estate_id = estate_id
    }

    let otherInfo = null
    if (
      userData?.invite_type === OUTSIDE_PROSPECT_KNOCK_INVITE_TYPE &&
      userData?.data1 &&
      userData?.data2
    ) {
      otherInfo = await require('./MarketPlaceService.js').getInfoFromContactRequests({
        email: userData.email,
        data1: userData?.data1,
        data2: userData?.data2
      })
    }
    // userData.birthday is default 1970-01-01.
    // So we can apply his birthday from marketplace if it is set there
    userData.birthday =
      userData.birthday === '1970-01-01' && otherInfo?.birthday
        ? otherInfo.birthday
        : userData.birthday
    userData.firstname = userData?.firstname ? userData.firstname : otherInfo?.firstname || ''
    userData.secondname = userData?.secondname ? userData.secondname : otherInfo?.secondname || ''
    const user = await User.createItem(omit(userData, ['data1', 'data2', 'invite_type']), trx)
    // return userData
    if (user.role === ROLE_USER) {
      try {
        // Create empty tenant and link to user

        const tenantData = {
          user_id: user.id,
          coord: userData?.signupData?.address?.coord,
          dist_type: userData?.signupData?.transport,
          dist_min: userData?.signupData?.time,
          address: userData?.signupData?.address?.title
        }

        if (otherInfo?.pets === true) {
          tenantData.pets = PETS_SMALL
        } else if (otherInfo?.pets === false) {
          tenantData.pets = PETS_NO
        }

        tenantData.members_count = otherInfo?.members || 1
        tenantData.income = otherInfo?.income || null

        const tenant = await Tenant.create(tenantData, trx)
        await require('./TenantService').updateTenantIsoline({ tenant, tenantid: tenant.id }, trx)

        const memberInfo = {
          firstname: user?.firstname,
          secondname: user?.secondname,
          is_verified: true
        }

        if (user.sex) memberInfo.sex = user.sex
        memberInfo.birthday = otherInfo?.birthday || null
        memberInfo.insolvency_proceed = otherInfo?.insolvency ? 1 : null
        const member = await MemberService.createMember(memberInfo, user.id, trx)

        if (otherInfo?.profession) {
          const incomeInfo = {
            member_id: member.id,
            income: otherInfo?.income || null,
            income_type: otherInfo?.profession
          }
          await Income.createItem(incomeInfo, trx)
        }
      } catch (e) {
        console.log('createUser exception', e)
        throw new HttpException(e.message, e.status || 400)
      }
    }

    return user
  }

  static async handleOutsideInvitation({ user, email, invite_type, data1, data2 }) {
    if (!invite_type || !data1 || !data2) {
      return
    }
    switch (invite_type) {
      case OUTSIDE_LANDLORD_INVITE_TYPE: // outside landlord invitation
        await require('./OutsideLandlordService').updateOutsideLandlordInfo({
          new_email: email,
          data1,
          data2
        })
        break
      case OUTSIDE_PROSPECT_KNOCK_INVITE_TYPE: // outside prospect knock on Marketplace
        await require('./MarketPlaceService.js').createPendingKnock({ user, data1, data2 })
        break
    }
  }

  /**
   *
   */
  static async createUserFromOAuth(
    request,
    { email, name, role, google_id, ...data },
    method = SIGN_IN_METHOD_GOOGLE
  ) {
    const [firstname, secondname] = name.split(' ')
    const password = `${google_id}#${Env.get('APP_NAME')}`

    let roles = [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER]
    if (role) {
      roles = [role]
    }
    // Check is user same email another role is exists
    const existingUser = await User.query().where('email', email).whereIn('role', roles).first()
    if (existingUser) {
      throw new AppException(USER_UNIQUE)
    }

    const userData = {
      ...data,
      email,
      firstname,
      secondname,
      password,
      role,
      google_id,
      status: STATUS_ACTIVE
    }

    const trx = await Database.beginTransaction()

    try {
      const user = await UserService.createUser(userData, trx)
      await trx.commit()
      if (request) {
        logEvent(request, LOG_TYPE_SIGN_UP, user.uid, {
          role: user.role,
          email: user.email,
          method
        })
      }

      if (process.env.NODE_ENV !== TEST_ENVIRONMENT) {
        Event.fire('mautic:createContact', user.id)
      }
      return user
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  static async changeEmail({ user, email, from_web }, trx) {
    user.email = email
    user.status = STATUS_EMAIL_VERIFY
    await user.save(trx)
    await UserService.sendConfirmEmail(user, from_web)
  }

  /**
   *
   */

  static async requestSendCodeForgotPassword(email, paramLang, from_web) {
    const code = getHash(3)
    let user = null
    try {
      user = await User.findByOrFail({ email })
      const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEB_KEY)

      const deepLink_URL = from_web
        ? `${
            process.env.SITE_URL
          }/reset-password?type=forgotpassword&code=${code}&email=${encodeURIComponent(email)}`
        : `${process.env.DEEP_LINK}?type=newpassword&code=${code}`

      const params = {
        dynamicLinkInfo: {
          domainUriPrefix: process.env.DOMAIN_PREFIX,
          link: deepLink_URL,
          androidInfo: {
            androidPackageName: process.env.ANDROID_PACKAGE_NAME
          },
          iosInfo: {
            iosBundleId: process.env.IOS_BUNDLE_ID,
            iosAppStoreId: process.env.IOS_APPSTORE_ID
          }
        }
      }

      if (user.role === ROLE_USER) {
        params.dynamicLinkInfo = {
          ...params.dynamicLinkInfo,
          desktopInfo: {
            desktopFallbackLink:
              process.env.DYNAMIC_ONLY_WEB_LINK || 'https://app.breeze4me.de/invalid-platform'
          }
        }
      }
      const { shortLink } = await firebaseDynamicLinks.createLink({
        ...params
      })
      await DataStorage.setItem(user.id, { code }, 'forget_password', { ttl: 3600 })
      const data = paramLang ? await this.getTokenWithLocale([user.id]) : null
      const lang =
        paramLang ||
        (data && data.length && data[0].lang ? data[0].lang : user.lang ? user.lang : DEFAULT_LANG)

      if (process.env.NODE_ENV === TEST_ENVIRONMENT) {
        return { shortLink, code }
      }

      await MailService.sendcodeForgotPasswordMail(
        user.email,
        shortLink,
        !from_web ? user.role : ROLE_LANDLORD,
        lang
      )
    } catch (error) {
      throw new HttpException(
        error.error ? error.error.message : error.message,
        error.error ? error.error.code : 400
      )
    }
  }

  /**
   *
   */
  static async requestSetPasswordForgotPassword(email, password, codeSent) {
    const trx = await Database.beginTransaction()
    try {
      const users = (await User.query().where('email', email).fetch()).rows

      if (!users || !users.length) {
        throw new HttpException(NOT_EXIST_WITH_EMAIL, 400)
      }

      let userId
      const codes = await Promise.all(
        users.map(async (user) => {
          const code = await DataStorage.getItem(user.id, 'forget_password')
          if (code) {
            userId = user.id
          }
          return code
        })
      )
      const data = codes.filter((code) => code)
      if (!data || !data.length) {
        throw new HttpException(INVALID_CONFIRM_CODE, 400)
      }

      const { code } = data[0] || {}
      if (code !== codeSent) {
        throw new HttpException(INVALID_CONFIRM_CODE, 400)
      }

      await Promise.all(
        users.map(async (user) => {
          user.password = password
          await user.save(trx)
        })
      )
      await trx.commit()
      await DataStorage.remove(userId, 'forget_password')
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  static async getHousehouseId(user_id) {
    try {
      const owner = await User.query().select('owner_id').where('id', user_id).firstOrFail()
      return owner
    } catch (e) {
      throw new HttpException(FAILED_GET_OWNER, e.status || 500)
    }
  }

  static async isHouseHold(user_id) {
    try {
      const owner = await this.getHousehouseId(user_id)
      return !owner.owner_id
    } catch (e) {
      return false
    }
  }

  static async updateDeviceToken(userId, device_token) {
    return await User.query().where('id', userId).update({ device_token })
  }

  /**
   *
   */
  static async sendConfirmEmail(user, from_web = false) {
    try {
      const date = String(new Date().getTime())
      const code = date.slice(date.length - 4, date.length)
      await DataStorage.setItem(user.id, { code }, 'confirm_email', { expire: 3600 })
      const lang = await UserService.getUserLang([user.id])
      const forgotLink = await UserService.getForgotShortLink(from_web)

      if (process.env.NODE_ENV === TEST_ENVIRONMENT) {
        return code
      }

      await MailService.sendUserConfirmation(user.email, {
        code,
        user,
        role: user.role,
        lang,
        forgotLink
      })
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  static async getForgotShortLink(from_web = false) {
    const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEB_KEY)

    const deepLink_URL = from_web
      ? `${process.env.SITE_URL}/forgotPassword`
      : `${process.env.DEEP_LINK}?type=forgotPassword`

    const { shortLink } = await firebaseDynamicLinks.createLink({
      dynamicLinkInfo: {
        domainUriPrefix: process.env.DOMAIN_PREFIX,
        link: deepLink_URL,
        androidInfo: {
          androidPackageName: process.env.ANDROID_PACKAGE_NAME
        },
        iosInfo: {
          iosBundleId: process.env.IOS_BUNDLE_ID,
          iosAppStoreId: process.env.IOS_APPSTORE_ID
        }
      }
    })
    return shortLink
  }

  /**
   *
   */
  static async resendUserConfirm(userId, from_web = false) {
    const user = await User.query().where('id', userId).first()
    if (!user) {
      throw new HttpException(USER_NOT_EXIST, 400)
    }
    if (user.status !== STATUS_EMAIL_VERIFY) {
      throw new HttpException(ACCOUNT_ALREADY_VERIFIED, 400)
    }
    await UserService.sendConfirmEmail(user, from_web)

    return true
  }

  /**
   *
   */
  static async confirmEmail(user, userCode, from_web = false) {
    const data = await DataStorage.getItem(user.id, 'confirm_email')
    const { code } = data || {}
    if (code !== userCode) {
      throw new AppException(INVALID_CONFIRM_CODE)
    }

    // TODO: check user status active is allow
    user.status = STATUS_ACTIVE
    const trx = await Database.beginTransaction()
    try {
      const MarketPlaceService = require('./MarketPlaceService.js')
      if (user.role === ROLE_USER) {
        if (user.source_estate_id) {
          // If user we look for his email on estate_current_tenant and make corresponding corrections
          await require('./EstateCurrentTenantService').updateOutsideTenantInfo(
            { user, estate_id: user.source_estate_id },
            trx
          )
          user.source_estate_id = null
        } else {
          // this is an email confirmation of someone who knocked on a marketplace link
          await require('./MarketPlaceService').createKnock({ user }, trx)
        }
      }

      await user.save(trx)
      await trx.commit()
      await require('./MatchService').matchByUser({
        userId: user.id,
        ignoreNullFields: true,
        has_notification_sent: true
      })
      MarketPlaceService.sendBulkKnockWebsocket(user.id)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 500)
    }

    await DataStorage.remove(user.id, 'confirm_email')

    const lang = await UserService.getUserLang([user.id])

    const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEB_KEY)

    const params = {
      dynamicLinkInfo: {
        domainUriPrefix: process.env.DOMAIN_PREFIX,
        link: `${process.env.DEEP_LINK}?type=profile&user_id=${user.id}&role=${user.role}`,
        androidInfo: {
          androidPackageName: process.env.ANDROID_PACKAGE_NAME
        },
        iosInfo: {
          iosBundleId: process.env.IOS_BUNDLE_ID,
          iosAppStoreId: process.env.IOS_APPSTORE_ID
        }
      }
    }

    if (user.role === ROLE_USER) {
      params.dynamicLinkInfo = {
        ...params.dynamicLinkInfo,
        desktopInfo: {
          desktopFallbackLink: process.env.DYNAMIC_ONLY_WEB_LINK || 'https://app.breeze4me.de/share'
        }
      }
    }

    const { shortLink } = await firebaseDynamicLinks.createLink({ ...params })
    const forgotLink = await UserService.getForgotShortLink(from_web)

    MailService.sendWelcomeMail(user, {
      code: shortLink,
      role: user.role,
      lang,
      forgotLink
    })
    return user
  }

  /**
   * Get tenant for user or create if not exists
   */
  static async getOrCreateTenant(user, trx = null) {
    if (user.role !== ROLE_USER) {
      throw new AppException(INVALID_USER_ROLE)
    }
    try {
      const tenant = await Tenant.query().where('user_id', user.id).first()
      if (tenant) {
        return tenant
      }

      return Tenant.create({ user_id: user.id }, trx)
    } catch (e) {
      throw new HttpException(e.message, e.status || 500, e.code || 0)
    }
  }

  /**
   *
   */
  static async calcUserZones(minId = 0) {
    const QueueService = use('App/Services/QueueService')
    const tenants = await Tenant.query()
      .whereNotNull('coord_raw')
      .whereNull('point_id')
      .where('id', '>', minId)
      .limit(1000)
      .fetch()

    return Promise.map(
      tenants.rows,
      (t) => {
        const { lat, lon } = t.getLatLon()
        if (lat && lon && t.dist_type && t.dist_min) {
          return QueueService.getAnchorIsoline(t.id)
        }

        return Promise.resolve()
      },
      { concurrency: 1 }
    )
  }

  /**
   *
   */
  static async getTenantInfo(userTenantId, landlordId) {
    const tenantUser = await User.query().select('id', 'owner_id').where('id', userTenantId).first()
    const mainUserId = tenantUser.owner_id || tenantUser.id

    const user = await User.query()
      .select('users.*')
      .select(Database.raw('? = ANY(ARRAY_AGG("_m"."share")) as share', [true]))
      .select(Database.raw('? = ANY(ARRAY_AGG("_m"."status")) as finish', [MATCH_STATUS_FINISH]))
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.user_id', 'users.id').onIn('_m.estate_id', function () {
          this.select('id').from('estates').where({ user_id: landlordId })
        })
        this.on(
          Database.raw('("_m"."share" = ? or "_m"."status" = ?)', [true, MATCH_STATUS_FINISH])
        )
      })
      .where({ 'users.id': mainUserId, 'users.role': ROLE_USER })
      .groupBy('users.id')
      .first()

    if (!user) {
      throw new AppException(USER_NOT_EXIST)
    }

    const isShare = user.finish || user.share
    // TODO: WARNING: SECURITY
    // const isShare = true

    const userData = user.toJSON({ publicOnly: !isShare })
    // Get tenant extend data
    const tenantQuery = Tenant.query().select('*').where('user_id', user.id)
    tenantQuery
      .with('members')
      .with('members.incomes')
      .with('members.incomes.proofs')
      .with('members.passports')
      .with('members.extra_passports')
      .with('members.extra_residency_proofs')
      .with('members.extra_score_proofs')

    if (user.finish) {
      tenantQuery.with('members.final_incomes').with('members.final_incomes.final_proofs')
    }
    const tenant = await tenantQuery.first()
    if (!tenant) {
      return userData
    }

    userData.tenant = tenant.toJSON({ isShort: !isShare })

    if (tenant.members) {
      userData.tenant.members = tenant
        .toJSON()
        .members.map((m) => (isShare ? m : pick(m, Member.limitFieldsList)))
    }

    return userData
  }

  /**
   *
   */
  static async landlordHasAccessTenant(landlordId, userTenantId) {
    const sharedMatch = await Database.table({ _m: 'matches' })
      .select('_m.estate_id')
      .where({ '_m.user_id': userTenantId })
      .whereIn('_m.estate_id', function () {
        this.select('id').from('estates').where({ user_id: landlordId })
      })
      .andWhere(function () {
        this.orWhere('_m.share', true)
        this.orWhere('_m.status', MATCH_STATUS_FINISH)
      })
      .first()

    return !!sharedMatch
  }

  static async increaseUnreadNotificationCount(id) {
    await Database.raw(
      'UPDATE users SET unread_notification_count = unread_notification_count + 1 WHERE id = ?',
      id
    )
  }

  static async getUserLang(userIds, limit = 500) {
    if (isEmpty(userIds)) {
      return []
    }
    userIds = uniq(userIds)
    const data = await Database.table('users')
      .select(Database.raw(`COALESCE(lang, ?) AS lang`, DEFAULT_LANG), 'id')
      .whereIn('id', Array.isArray(userIds) ? userIds : [userIds])
      .limit(Math.min(userIds.length, limit))

    const lang = data?.[0]?.lang || DEFAULT_LANG
    return lang
  }

  /**
   *
   */
  static async getTokenWithLocale(userIds, limit = 500) {
    if (isEmpty(userIds)) {
      return []
    }
    userIds = uniq(userIds)
    const data = await Database.table('users')
      .select('device_token', Database.raw(`COALESCE(lang, ?) AS lang`, DEFAULT_LANG), 'id')
      .whereIn('id', Array.isArray(userIds) ? userIds : [userIds])
      .whereNot('device_token', '')
      .whereNot('device_token', null)
      .where('notice', true)
      .limit(Math.min(userIds.length, limit))

    return data
  }

  static async getUserIdsByToken(devices) {
    if (!devices || !devices.length) {
      return []
    }
    const deviceTokens = devices.map((d) => d.identifier)
    const users = (
      await User.query().select('id', 'device_token').whereIn('device_token', deviceTokens).fetch()
    ).rows
    return users
  }

  /**
   *
   */
  static async getNewestInactiveLandlordsIds() {
    return Database.select('_u.id', '_u.lang')
      .table({ _u: 'users' })
      .leftJoin({ _e: 'estates' }, function () {
        this.on('_e.user_id', '_u.id').onIn('_e.status', [STATUS_ACTIVE])
      })
      .where({ '_u.role': ROLE_LANDLORD, '_u.status': STATUS_ACTIVE })
      .whereNull('_e.id')
      .where('_u.created_at', '>=', moment().add(-1, 'days').format(DATE_FORMAT))
      .limit(500)
  }

  /**
   *
   */
  static async get7DaysInactiveLandlord() {
    return Database.select('_u.id', '_u.lang')
      .table({ _u: 'users' })
      .leftJoin({ _e: 'estates' }, function () {
        this.on('_e.user_id', '_u.id').onIn('_e.status', [
          STATUS_ACTIVE,
          STATUS_DRAFT,
          STATUS_EXPIRE
        ])
      })
      .where({ '_u.role': ROLE_LANDLORD, '_u.status': STATUS_ACTIVE })
      .whereNull('_e.id')
      .where('_u.created_at', '<=', moment().add(-7, 'days').format(DATE_FORMAT))
      .where('_u.created_at', '>=', moment().add(-8, 'days').format(DATE_FORMAT))
      .limit(500)
  }

  static async resetUnreadNotificationCount(id) {
    return Database.raw('UPDATE users SET unread_notification_count = 0 WHERE id = ?', id)
  }

  static async updatePaymentPlan(userId, plan_id, payment_plan, trx = null) {
    return await User.query()
      .where({ id: userId })
      .update(
        {
          plan_id,
          payment_plan,
          member_plan_date: moment().utc().format('YYYY-MM-DD HH:mm:ss')
        },
        trx
      )
  }

  static async verifyUsers(adminId, userIds, is_verify) {
    return await User.query()
      .whereIn('id', userIds)
      .update({
        activation_status: USER_ACTIVATION_STATUS_ACTIVATED,
        is_verified: is_verify,
        verified_by: adminId,
        verified_date: moment().utc().format('YYYY-MM-DD HH:mm:ss')
      })
  }

  static async getByIdWithRole(ids, role) {
    return await User.query().whereIn('id', ids).where({ role }).pluck('id')
  }

  static async getById(id, role) {
    const query = User.query().where('id', id).whereNot('status', STATUS_DELETE)
    if (role === ROLE_LANDLORD) {
      query.where('role', ROLE_LANDLORD)
      // query.where('activation_status', USER_ACTIVATION_STATUS_ACTIVATED)
    }
    return await query.first()
  }

  static async getByEmailWithRole(emails, role) {
    emails = Array.isArray(emails) ? emails : [emails]
    emails = emails.map((email) => email.toLocaleLowerCase())
    return await User.query()
      .select(['id', 'email', 'lang'])
      .whereIn('email', emails)
      .whereNotIn('status', [STATUS_DELETE])
      .where({ role })
      .fetch()
  }

  static async getByRole(role) {
    return (await User.query().select('*').where('role', role).fetch()).rows
  }

  static async getLangByIds({ ids, status = null }) {
    const query = User.query()
      .select(['id', 'email', 'lang'])
      .whereNot('status', STATUS_DELETE)
      .whereIn('id', ids)

    if (status) {
      query.where('status', status)
    }

    return (await query.fetch()).rows
  }

  static async housekeeperSignup({
    code,
    email,
    password,
    firstname,
    secondname,
    ip,
    ip_based_info,
    lang
  }) {
    const member = await Member.query()
      .select('user_id', 'id')
      .where('email', email)
      .where('code', code)
      .first()

    if (!member) {
      throw new HttpException(MEMBER_NOT_EXIST, 400)
    }

    const trx = await Database.beginTransaction()
    let user, isExistUser
    try {
      // Check user not exists
      user = await User.query().where('email', email).where('role', ROLE_USER).first()
      if (user) {
        user.is_household_invitation_onboarded = false
        user.is_profile_onboarded = true
        isExistUser = true
        await user.save(trx)
      } else {
        isExistUser = false
        user = await this.createUser(
          {
            role: ROLE_USER,
            password,
            owner_id: member.user_id,
            lang,
            is_household_invitation_onboarded: false,
            is_profile_onboarded: true,
            email,
            firstname,
            secondname,
            status: STATUS_EMAIL_VERIFY,
            ip,
            ip_based_info
          },
          trx
        )
      }

      await MemberService.setMemberOwner(
        {
          member_id: member.id,
          firstname: user.firstname || firstname,
          secondname: user.secondname || secondname,
          owner_id: user.id
        },
        trx
      )
      if (!isExistUser) {
        await this.sendConfirmEmail(user)
      }

      await trx.commit()

      Event.fire('mautic:createContact', user.id)

      return user
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async sendSMS(userId, phone, paramLang) {
    const code = random.int(1000, 9999)
    const lang = await UserService.getUserLang([userId])

    const txt = l.get('landlord.email_verification.subject.message', lang) + ` ${code}`
    await DataStorage.setItem(userId, { code, count: 5 }, SMS_VERIFY_PREFIX, { ttl: 3600 })

    if (process.env.NODE_ENV === TEST_ENVIRONMENT) {
      return code
    }

    await SMSService.send({ to: phone, txt })
  }

  static async removeUserOwnerId(user_id, trx) {
    if (trx) {
      return User.query()
        .where('id', user_id)
        .update({ owner_id: null, is_household_invitation_onboarded: true })
        .transacting(trx)
    }
    return User.query()
      .where('id', user_id)
      .update({ owner_id: null, is_household_invitation_onboarded: true })
  }

  static async confirmSMS(email, phone, code) {
    const user = await User.query().select('id').where('email', email).where('phone', phone).first()

    if (!user) {
      throw new HttpException(USER_NOT_EXIST, 400)
    }

    const data = await DataStorage.getItem(user.id, SMS_VERIFY_PREFIX)

    if (!data) {
      throw new HttpException(NO_CODE_PASSED, 400)
    }

    if (parseInt(data.code) !== parseInt(code)) {
      await DataStorage.remove(user.id, SMS_VERIFY_PREFIX)

      if (parseInt(data.count) <= 0) {
        throw new HttpException(SMS_CODE_NOT_VALID, 400)
      }

      await DataStorage.setItem(
        user.id,
        { code: data.code, count: parseInt(data.count) - 1 },
        SMS_VERIFY_PREFIX,
        { ttl: 3600 }
      )
      throw new HttpException(SMS_CODE_NOT_CORERECT, 400)
    }

    await User.query().where({ id: user.id }).update({
      status: STATUS_ACTIVE
    })

    await DataStorage.remove(user.id, SMS_VERIFY_PREFIX)
    return true
  }

  static async proceedBuddyInviteLink(uid, tenantId) {
    const landlord = await Database.table('users')
      .select('id as landlordId')
      .where('uid', uid)
      .first()

    const tenant = await Database.table('users').where('id', tenantId).first()

    if (!tenant || !landlord) {
      throw new AppException(WRONG_INVITATION_LINK)
    }

    const { landlordId } = landlord

    // TODO: if phone number & email are not defined???
    const buddy = await Buddy.query()
      .where('user_id', landlordId)
      .where('phone', tenant.phone)
      .where('email', tenant.email)
      .first()
    if (buddy) {
      if (!buddy.name) buddy.name = tenant.firstname
      if (!buddy.tenant_id) buddy.tenant_id = tenant.tenantId
      buddy.status = BUDDY_STATUS_ACCEPTED
      await buddy.save()
    } else {
      const newBuddy = new Buddy()
      newBuddy.name = tenant.firstname
      newBuddy.phone = tenant.phone
      newBuddy.email = tenant.email
      newBuddy.user_id = landlordId
      newBuddy.tenant_id = tenantId
      newBuddy.status = BUDDY_STATUS_ACCEPTED
      await newBuddy.save()
    }

    return true
  }

  static async updateFreeUserPlans(old_plan_id, plan_id, trx) {
    await User.query().where('plan_id', old_plan_id).update({ plan_id }).transacting(trx)
  }

  static async getUserByPaymentPlan(plan_ids) {
    if (isArray(plan_ids)) {
      return (await User.query().whereIn('plan_id', plan_ids).fetch()).rows
    } else {
      return await User.query().where('plan_id', plan_ids).first()
    }
  }

  static async signUp(
    {
      email,
      firstname,
      from_web,
      source_estate_id = null,
      invite_type = '',
      data1,
      data2,
      ip,
      ip_based_info,
      ...userData
    },
    trx = null,
    sendVerification = true
  ) {
    let roles = [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER]
    const role = userData.role
    if (!roles.includes(role)) {
      throw new HttpException(INVALID_USER_ROLE, 401)
    }
    if (role) {
      roles = [role]
    }

    const availableUser = await User.query()
      .where('email', email)
      .whereIn('role', roles)
      .orderBy('updated_at', 'desc')
      .first()

    if (availableUser) {
      throw new HttpException(USER_UNIQUE, 400)
    }

    try {
      const user = await this.createUser(
        {
          ...userData,
          email,
          firstname,
          status: STATUS_EMAIL_VERIFY,
          data1,
          data2,
          invite_type,
          source_estate_id,
          ip,
          ip_based_info,
          activation_status: USER_ACTIVATION_STATUS_ACTIVATED
        },
        trx
      )

      if (isEmpty(ip_based_info?.country_code)) {
        const QueueService = require('./QueueService.js')
        QueueService.getIpBasedInfo(user.id, ip)
      }

      if (!trx && process.env.NODE_ENV !== TEST_ENVIRONMENT) {
        // If there is trx, we should fire this event after the transaction is committed
        Event.fire('mautic:createContact', user.id)
      }

      if (sendVerification) {
        await UserService.sendConfirmEmail(user, from_web)
        if (role === ROLE_LANDLORD) {
          const lang = await UserService.getUserLang([user.id])
          const text =
            `New Landlord Account Created:\r\n` +
            `==============================\r\n` +
            `Email: ${email}\r\n` +
            `Name: ${l.get('start.account.verification.salutation', lang)}\r\n` +
            `IP Address: ${ip}\r\n` +
            `IP Based Info:\r\n` +
            ` - City: ${ip_based_info.city || 'Not Specified'}\r\n` +
            ` - Country: ${ip_based_info.country_name || 'Not Specified'}\r\n`
          await MailService.sendTextEmail(
            ACCOUNT_CREATION_EMAIL_NOTIFICATION_RECIPIENTS,
            LANDLORD_ACCOUNT_CREATION_EMAIL_NOTIFICATION_SUBJECT,
            text
          )
        }
      }
      return user
    } catch (e) {
      if (e.constraint === 'users_uid_unique') {
        throw new HttpException(USER_UNIQUE, 400)
      }

      throw e
    }
  }

  static async getCountOfProspects() {
    return await User.query().count('*').where('role', ROLE_USER)
  }

  static async updateCompany({ user_id, company_id }, trx) {
    const query = User.query().where('id', user_id).update({ company_id })

    if (trx) {
      return await query.transacting(trx)
    }

    return await query
  }

  static async setOnboardingStep(user) {
    if (!user) {
      throw new HttpException(NO_USER_PASSED, 400)
    }
    user.onboarding_step = PASS_ONBOARDING_STEP_COMPANY
    if (user.company_id && (!user.preferred_services || trim(user.preferred_services) === '')) {
      const company = await require('./CompanyService').getUserCompany(user.id, user.company_id)
      user.company = company
      if (company.name && company.size && company.type) {
        user.onboarding_step = PASS_ONBOARDING_STEP_PREFERRED_SERVICES
      }
    } else if (user.company_id && user.preferred_services && trim(user.preferred_services) !== '') {
      user.onboarding_step = null
    }

    return user
  }

  static async login({ email, role, device_token }) {
    let roles = [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER]
    if (role) {
      roles = [role]
    }

    // Check if user is admin
    if (role === ROLE_LANDLORD) {
      const adminAttempt = await this.handleAdminLoginFromLandlord(email)
      if (adminAttempt) return adminAttempt
    }

    const user = await User.query()
      .select('*')
      .where('email', email)
      .whereIn('role', roles)
      .whereNot('status', STATUS_DELETE)
      .orderBy('updated_at', 'desc')
      .first()

    if (!user) {
      throw new HttpException(USER_NOT_EXIST, 400)
    }

    if (user.status !== STATUS_ACTIVE) {
      await UserService.sendConfirmEmail(user.toJSON({ isOwner: true }))
      /* @description */
      // Merge error code and user id and send as a response
      // Because client needs user id to call verify code endpoint
      throw new HttpException(
        USER_NOT_VERIFIED,
        400,
        parseInt(`${ERROR_USER_NOT_VERIFIED_LOGIN}${user.id}`)
      )
    }
    role = user.role

    if (device_token) {
      await User.query().where({ id: user.id }).update({ device_token })
    }
    Event.fire('mautic:syncContact', user.id, { last_signin_date: new Date() })
    return user
  }

  static async setIpBasedInfo(user, ip) {
    if (!user.ip_based_info && SET_EMPTY_IP_BASED_USER_INFO_ON_LOGIN) {
      const ip_based_info = await getIpBasedInfo(ip)
      if (ip_based_info) {
        await User.query().where('id', user.id).update({ ip, ip_based_info })
      }
    }
  }

  static async handleAdminLoginFromLandlord(email, auth) {
    const adminUser = await Admin.query()
      .select('admins.*')
      .select(Database.raw(`${ROLE_LANDLORD} as role`))
      .select(Database.raw(`true as is_admin`))
      .select(Database.raw(`${STATUS_ACTIVE} as status`))
      .select(Database.raw(`true as real_admin`))
      .where('email', email)
      .first()

    if (adminUser) {
      return { user: adminUser, isAdmin: true }
    }

    return null
  }

  /**
   *
   * @param {*} id
   * This function only has to be used deleting fake user
   */
  static async removeUser(id) {
    await User.query().delete().where('id', id)
  }

  static async me(user, pushToken) {
    user = await User.query()
      .where('users.id', user.id)
      .with('household')
      .with('plan')
      .with('company', function (query) {
        query.with('contacts')
      })
      .with('letter_template')
      .with('tenantPaymentPlan')
      .with('feedbacks')
      .with('certificates')
      .first()

    if (!user) {
      throw new HttpException(USER_NOT_EXIST)
    }

    const tenant = await require('./TenantService').getTenant(user.owner_id ?? user.id)

    if (user) {
      if (pushToken && user.device_token !== pushToken) {
        await user.updateItem({ device_token: pushToken })
      }

      if (user.role == ROLE_LANDLORD) {
        user.is_activated = user.activation_status == USER_ACTIVATION_STATUS_ACTIVATED
        user = await this.setOnboardingStep(user)
      } else if (user.role == ROLE_USER) {
        user.has_final_match = await require('./MatchService').checkUserHasFinalMatch(user.id)
      }
      // set last login
      await User.query().where('id', user.id).update({ last_login: moment().utc().format() })

      Event.fire('mautic:syncContact', user.id, { last_openapp_date: new Date() })
    }

    if (tenant) {
      user.tenant = tenant
    }

    if (user.preferred_services) {
      user.preferred_services = JSON.parse(user.preferred_services)
    }

    user = user.toJSON({ isOwner: true })
    user.is_admin = false

    if (user.role === ROLE_LANDLORD) {
      // TODO: we should cover this field in the tests
      user.has_property = await require('./EstateService').hasEstate(user.id)
    }

    return user
  }

  static async closeAccount(user) {
    user = await User.query().where('id', user.id).first()
    const email = user.email
    let existingUser = false
    let newEmail
    do {
      newEmail = `${email.concat('_breezeClose')}_${random.int(0, 99999)}`
      existingUser = await User.query().where('email', newEmail).first()
    } while (existingUser)
    user.email = newEmail
    user.firstname = ' USER'
    user.secondname = ' DELETED'
    user.approved_landlord = false
    user.is_admin = false
    user.device_token = null
    user.google_id = null
    user.status = STATUS_DELETE

    await user.save()
    return user
  }

  static async updateProfile(request, user) {
    const data = request.all()

    if (user.role === ROLE_USER) {
      delete data.landlord_visibility
    } else if (user.role === ROLE_LANDLORD) {
      delete data.prospect_visibility
    }

    const trx = await Database.beginTransaction()
    delete data.password

    try {
      user = await UserService.updateAvatar(request, user)

      if (Object.keys(data).length) {
        if (data.email) {
          await this.changeEmail({ user, email: data.email, from_web: data.from_web }, trx)
        }

        const userData = omit(data, ['company_name', 'size', 'contact'])
        if (Object.keys(userData).length) {
          await user.updateItemWithTrx(userData, trx)
        }
        user = user.toJSON({ isOwner: true })

        await require('./EstateCurrentTenantService').updateEstateTenant(data, user, trx)

        let needCompanyUpdate = false
        let companyData = {}
        if (data && data.company_name) {
          needCompanyUpdate = true
          companyData = {
            name: data.company_name
          }
        }

        if (data && data.size) {
          needCompanyUpdate = true
          companyData = {
            ...companyData,
            size: data.size
          }
        }

        if (needCompanyUpdate) {
          await require('./CompanyService').updateCompany(user.id, companyData, trx)
        }

        if (data && data.contact) {
          const contactKeys = Object.keys(data.contact)
          const contactInfo = contactKeys.map((key) => data.contact[key])
          if (contactInfo.filter((i) => i).length) {
            await this.updateContact({ user_id: user.id, data: data.contact }, trx)
          }
        }
        await trx.commit()
        user = await this.setOnboardingStep(user)
        user.company = await require('./CompanyService').getUserCompany(user.id, user.company_id)
        Event.fire('mautic:syncContact', user.id)
      } else {
        await trx.rollback()
      }

      if (user.role === ROLE_LANDLORD) {
        // TODO: we should cover this field in the tests
        user = await this.me(user)
      }

      return user
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async updateContact({ user_id, data }, trx) {
    const CompanyService = require('./CompanyService')
    const currentContacts = await CompanyService.getContacts(user_id)

    try {
      if (data.address) {
        await CompanyService.updateCompany(user_id, { address: data.address }, trx)
      }

      if (!currentContacts || !currentContacts.rows || !currentContacts.rows.length) {
        await CompanyService.createContact({ user_id, data: omit(data, ['address']) }, trx)
      } else {
        const contact = currentContacts.rows[0]
        if (Object.keys(omit(data, ['address'])).length) {
          await CompanyService.updateContact(
            { id: contact.id, user_id, data: omit(data, ['address']) },
            trx
          )
        }
      }
    } catch (e) {
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async updateAvatar(request, user) {
    if (!request.header('content-type').match(/^multipart/)) {
      return user
    }

    const fileSettings = { types: ['image'], size: '10mb' }
    const filename = `${uuid.v4()}.png`
    let avatarUrl, tmpFile
    request.multipart.file(`file`, fileSettings, async (file) => {
      tmpFile = await require('./ImageService').resizeAvatar(file, filename)
      const sourceStream = fs.createReadStream(tmpFile)
      avatarUrl = await Drive.disk('s3public').put(
        `${moment().format('YYYYMM')}/${filename}`,
        sourceStream,
        { ACL: 'public-read', ContentType: 'image/png' }
      )
    })

    await request.multipart.process()
    if (avatarUrl) {
      user.avatar = avatarUrl
      await user.save()
    }
    fs.unlink(tmpFile, () => {})

    return user
  }

  static async changePassword(user, current_password, new_password) {
    const verifyPassword = await Hash.verify(current_password, user.password)

    if (!verifyPassword) {
      throw new HttpException(CURRENT_PASSWORD_NOT_VERIFIED, 400)
    }
    const users = (
      await User.query()
        .where('email', user.email)
        .whereIn('role', [ROLE_USER, ROLE_LANDLORD])
        .limit(2)
        .fetch()
    ).rows

    const updatePass = async (user) => user.updateItem({ password: new_password }, true)
    await Promise.map(users, updatePass)
    return true
  }

  static async verifyGoogleToken(token) {
    try {
      const ticket = await GoogleAuth.verifyIdToken({
        idToken: token,
        audience: Config.get('services.ally.google.client_id')
      })
      return ticket
    } catch (e) {
      throw new HttpException(INVALID_TOKEN, 400)
    }
  }

  static emitAccountEnabled(ids, data) {
    ids = !Array.isArray(ids) ? [ids] : ids

    ids.map((id) => {
      WebSocket.publishToLandlord({
        event: WEBSOCKET_EVENT_USER_ACTIVATE,
        userId: id,
        data
      })
    })
  }

  static async socialLoginAccountActive(id, data) {
    await User.query().where('id', id).update(data)
  }
}

module.exports = UserService
