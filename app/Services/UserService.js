'use strict'

const { FirebaseDynamicLinks } = use('firebase-dynamic-links')

const uuid = require('uuid')
const moment = require('moment')
const { isArray, isEmpty, uniq, pick, trim, unset } = require('lodash')
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
const Agreement = use('App/Models/Agreement')
const MailService = use('App/Services/MailService')
const AppException = use('App/Exceptions/AppException')
const HttpException = use('App/Exceptions/HttpException')
const SMSService = use('App/Services/SMSService')
const Event = use('Event')
const Logger = use('Logger')
const l = use('Localize')
const MemberService = use('App/Services/MemberService')
const { getHash } = require('../Libs/utils.js')
const random = require('random')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Drive = use('Drive')
const Hash = use('Hash')
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
  },
} = require('../../app/excepions')

const { logEvent } = require('./TrackingService.js')

class UserService {
  /**
   * Create user flow
   */
  static async createUser(userData, trx = null) {
    //we need him to approve Terms and Privacy
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

    const user = await User.createItem(userData, trx)
    if (user.role === ROLE_USER) {
      try {
        // Create empty tenant and link to user
        const tenant = userData.signupData
        await Tenant.createItem(
          {
            user_id: user.id,
            coord: tenant?.address?.coord,
            dist_type: tenant?.transport,
            dist_min: tenant?.time,
            address: tenant?.address?.title,
          },
          trx
        )
      } catch (e) {
        console.log('createUser exception', e)
      }
    }
    return { user }
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
      throw new AppException('User same email, another role exists')
    }

    const userData = {
      ...data,
      email,
      firstname,
      secondname,
      password,
      role,
      google_id,
      status: STATUS_ACTIVE,
    }

    const { user } = await UserService.createUser(userData)

    if (request) {
      logEvent(request, LOG_TYPE_SIGN_UP, user.uid, {
        role: user.role,
        email: user.email,
        method,
      })
    }

    if (process.env.NODE_ENV !== TEST_ENVIRONMENT) {
      Event.fire('mautic:createContact', user.id)
    }
    return user
  }

  /**
   *
   */
  static async changeEmail({ user, email, from_web }, trx) {
    try {
      user.email = email
      user.status = STATUS_EMAIL_VERIFY
      await user.save(trx)
      await UserService.sendConfirmEmail(user, from_web)
    } catch (e) {
      throw e
    }
  }

  /**
   *
   */

  static async requestSendCodeForgotPassword(email, paramLang, from_web) {
    const code = getHash(3)
    let user = null
    email = encodeURI(email)
    try {
      user = await User.findByOrFail({ email })
      const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEB_KEY)

      const deepLink_URL = from_web
        ? `${process.env.SITE_URL}/reset-password?type=forgotpassword&code=${code}&email=${email}`
        : `${process.env.DEEP_LINK}?type=newpassword&code=${code}`
      const { shortLink } = await firebaseDynamicLinks.createLink({
        dynamicLinkInfo: {
          domainUriPrefix: process.env.DOMAIN_PREFIX,
          link: deepLink_URL,
          androidInfo: {
            androidPackageName: process.env.ANDROID_PACKAGE_NAME,
          },
          iosInfo: {
            iosBundleId: process.env.IOS_BUNDLE_ID,
          },
        },
      })
      await DataStorage.setItem(user.id, { code }, 'forget_password', { ttl: 3600 })
      const data = paramLang ? await this.getTokenWithLocale([user.id]) : null
      const lang = paramLang
        ? paramLang
        : data && data.length && data[0].lang
        ? data[0].lang
        : user.lang
        ? user.lang
        : DEFAULT_LANG

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
    let user = null
    try {
      user = await User.findByOrFail({ email })
    } catch (error) {
      throw new AppException(NOT_EXIST_WITH_EMAIL)
    }

    const data = await DataStorage.getItem(user.id, 'forget_password')
    const { code } = data || {}
    if (code !== codeSent) {
      throw new HttpException(INVALID_CONFIRM_CODE, 400)
    }

    user.password = password
    await user.save()
    await DataStorage.remove(user.id, 'forget_password')
  }

  static async getHousehouseId(user_id) {
    try {
      const owner = await User.query().select('owner_id').where('id', user_id).firstOrFail()
      return owner
    } catch (e) {
      throw new HttpException(FAILED_GET_OWNER, 500)
    }
  }

  static async updateDeviceToken(userId, device_token) {
    return await User.query().where('id', userId).update({ device_token: device_token })
  }

  /**
   *
   */
  static async sendConfirmEmail(user, from_web = false) {
    try {
      const date = String(new Date().getTime())
      const code = date.slice(date.length - 4, date.length)
      await DataStorage.setItem(user.id, { code }, 'confirm_email', { ttl: 3600 })
      const data = await UserService.getTokenWithLocale([user.id])
      const lang = data && data.length && data[0].lang ? data[0].lang : user.lang

      const forgotLink = await UserService.getForgotShortLink(from_web)

      if (process.env.NODE_ENV === TEST_ENVIRONMENT) {
        return code
      }

      await MailService.sendUserConfirmation(user.email, {
        code,
        user: user,
        role: user.role,
        lang: lang,
        forgotLink: forgotLink,
      })
    } catch (e) {
      throw new HttpException(e)
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
          androidPackageName: process.env.ANDROID_PACKAGE_NAME,
        },
        iosInfo: {
          iosBundleId: process.env.IOS_BUNDLE_ID,
        },
      },
    })
    return shortLink
  }
  /**
   *
   */
  static async resendUserConfirm(userId) {
    const user = await User.query().where('id', userId).where('status', STATUS_EMAIL_VERIFY).first()
    if (!user) {
      return false
    }
    await UserService.sendConfirmEmail(user)

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
      if (user.role === ROLE_USER && user.source_estate_id) {
        //If user we look for his email on estate_current_tenant and make corresponding corrections
        await require('./EstateCurrentTenantService').updateOutsideTenantInfo(
          user,
          user.source_estate_id,
          trx
        )
        user.source_estate_id = null
      }
      await user.save(trx)
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }

    await DataStorage.remove(user.id, 'confirm_email')

    const localData = await UserService.getTokenWithLocale([user.id])
    const lang = localData && localData.length && localData[0].lang ? localData[0].lang : user.lang

    const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEB_KEY)

    const { shortLink } = await firebaseDynamicLinks.createLink({
      dynamicLinkInfo: {
        domainUriPrefix: process.env.DOMAIN_PREFIX,
        link: `${process.env.DEEP_LINK}?type=profile&user_id=${user.id}&role=${user.role}`,
        androidInfo: {
          androidPackageName: process.env.ANDROID_PACKAGE_NAME,
        },
        iosInfo: {
          iosBundleId: process.env.IOS_BUNDLE_ID,
        },
      },
    })
    const forgotLink = await UserService.getForgotShortLink(from_web)

    await MailService.sendWelcomeMail(user, {
      code: shortLink,
      role: user.role,
      lang: lang,
      forgotLink: forgotLink,
    })
    return user
  }

  /**
   * Get tenant for user or create if not exists
   */
  static async getOrCreateTenant(user, trx = null) {
    if (user.role !== ROLE_USER) {
      throw new AppException('Invalid tenant user role')
    }
    const tenant = await Tenant.query().where('user_id', user.id).first()
    if (tenant) {
      return tenant
    }

    return Tenant.createItem({ user_id: user.id }, trx)
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

    //TODO: WARNING: SECURITY
    // const isShare = user.finish || user.share
    const isShare = true

    let userData = user.toJSON({ publicOnly: !isShare })
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

    return sharedMatch ? true : false
  }

  static async increaseUnreadNotificationCount(id) {
    await Database.raw(
      'UPDATE users SET unread_notification_count = unread_notification_count + 1 WHERE id = ?',
      id
    )
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
      .whereIn('id', userIds)
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
          STATUS_EXPIRE,
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
          plan_id: plan_id,
          payment_plan: payment_plan,
          member_plan_date: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
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
        verified_date: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      })
  }

  static async getByIdWithRole(ids, role) {
    return await User.query().whereIn('id', ids).where({ role: role }).pluck('id')
  }

  static async getById(id) {
    return await User.query().where('id', id).firstOrFail()
  }

  static async getByEmailWithRole(emails, role) {
    return await User.query()
      .select(['id', 'email'])
      .whereIn('email', emails)
      .where({ role: role })
      .fetch()
  }

  static async getByRole(role) {
    return (await User.query().select('*').where('role', role).fetch()).rows
  }

  static async housekeeperSignup({ code, email, password, firstname, lang }) {
    const member = await Member.query()
      .select('user_id', 'id')
      .where('email', email)
      .where('code', code)
      .first()

    if (!member) {
      throw new HttpException(MEMBER_NOT_EXIST, 400)
    }

    const ownerId = member.id

    // Check user not exists
    const availableUser = await User.query().where('email', email).first()
    if (availableUser) {
      throw new HttpException(USER_UNIQUE, 400)
    }

    if (!(await User.query().where('id', ownerId).first())) {
      throw new HttpException(HOUSEHOLD_NOT_EXIST, 400)
    }

    const trx = await Database.beginTransaction()
    try {
      const user = await User.createItem(
        {
          email,
          role: ROLE_USER,
          password,
          owner_id: ownerId,
          status: STATUS_EMAIL_VERIFY,
          firstname,
          lang,
          is_household_invitation_onboarded: false,
          is_profile_onboarded: true,
        },
        trx
      )

      await Tenant.create({ user_id: user.id }, trx)

      await this.sendConfirmEmail(user)
      await trx.commit()

      if (user) {
        await MemberService.setMemberOwner(member_id, user.id)
      }
      Event.fire('mautic:createContact', user.id)

      return user
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      return null
    }
  }

  static async sendSMS(userId, phone, paramLang) {
    const code = random.int(1000, 9999)
    const data = await UserService.getTokenWithLocale([userId])

    const lang = paramLang ? paramLang : data && data.length && data[0].lang ? data[0].lang : 'en'

    const txt = l.get('landlord.email_verification.subject.message', lang) + ` ${code}`
    await DataStorage.setItem(userId, { code: code, count: 5 }, SMS_VERIFY_PREFIX, { ttl: 3600 })

    if (process.env.NODE_ENV === TEST_ENVIRONMENT) {
      return code
    }

    await SMSService.send({ to: phone, txt: txt })
  }

  static async removeUserOwnerId(user_id, trx) {
    return User.query().where('id', user_id).update({ owner_id: null }, trx)
  }

  static async confirmSMS(email, phone, code) {
    const user = await User.query().select('id').where('email', email).where('phone', phone).first()

    if (!user) {
      throw new HttpException(USER_NOT_EXIST, 400)
    }

    const data = await DataStorage.getItem(user.id, SMS_VERIFY_PREFIX)

    if (!data) {
      throw new HttpException('No code', 400)
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
      status: STATUS_ACTIVE,
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

    //TODO: if phone number & email are not defined???
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
    await User.query().where('plan_id', old_plan_id).update({ plan_id: plan_id }).transacting(trx)
  }

  static async getUserByPaymentPlan(plan_ids) {
    if (isArray(plan_ids)) {
      return (await User.query().whereIn('plan_id', plan_ids).fetch()).rows
    } else {
      return await User.query().where('plan_id', plan_id).first()
    }
  }

  static async signUp(
    { email, firstname, from_web, source_estate_id = null, data1, data2, ...userData },
    trx = null
  ) {
    // Manages the outside tenant invitation flow
    if (!source_estate_id && data1 && data2) {
      const { estate_id } = await require('./EstateCurrentTenantService').handleInvitationLink({
        data1,
        data2,
        email,
      })
      source_estate_id = estate_id
    }

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
      const { user } = await this.createUser(
        {
          ...userData,
          email,
          firstname,
          status: STATUS_EMAIL_VERIFY,
          source_estate_id,
        },
        trx
      )
      if (!trx && process.env.NODE_ENV !== TEST_ENVIRONMENT) {
        // If there is trx, we should fire this event after the transaction is committed
        Event.fire('mautic:createContact', user.id)
      }
      await UserService.sendConfirmEmail(user, from_web)
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
    let query = User.query().where('id', user_id).update({ company_id })

    if (trx) {
      return await query.transacting(trx)
    }

    return await query
  }

  static setOnboardingStep(user) {
    if (!user) {
      throw new HttpException(NO_USER_PASSED, 500)
    }
    user.onboarding_step = PASS_ONBOARDING_STEP_COMPANY
    if (user.company_id && (!user.preferred_services || trim(user.preferred_services) === '')) {
      user.onboarding_step = PASS_ONBOARDING_STEP_PREFERRED_SERVICES
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
    const user = await User.query()
      .select('*')
      .where('email', email)
      .whereIn('role', roles)
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

    await User.query().where({ email }).update({ device_token: null })
    if (device_token) {
      await User.query().where({ id: user.id }).update({ device_token })
    }

    Event.fire('mautic:syncContact', user.id, { last_signin_date: new Date() })
    return user
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
        user = this.setOnboardingStep(user)
      } else if (user.role == ROLE_USER) {
        user.has_final_match = await require('./MatchService').checkUserHasFinalMatch(user.id)
      }

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
    return user
  }

  static async closeAccount(user) {
    user = await User.query().where('id', user.id).first()
    const email = user.email
    const newEmail = email.concat('_breezeClose')
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

    let company
    user.role === ROLE_USER
      ? delete data.landlord_visibility
      : user.role === ROLE_LANDLORD
      ? delete data.prospect_visibility
      : data

    const trx = await Database.beginTransaction()

    try {
      if (data.email) {
        await this.changeEmail({ user, email: data.email, from_web: data.from_web }, trx)
      }
      await user.updateItemWithTrx(data, trx)
      user = user.toJSON({ isOwner: true })

      await require('./EstateCurrentTenantService').updateEstateTenant(data, user, trx)
      user = this.setOnboardingStep(user)
      await trx.commit()

      user.company = await require('./CompanyService').getUserCompany(user.id, user.company_id)
      Event.fire('mautic:syncContact', user.id)

      return user
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }
  }

  static async updateAvatar(request, user) {
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
}

module.exports = UserService
