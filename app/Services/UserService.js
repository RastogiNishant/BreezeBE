'use strict'

const { FirebaseDynamicLinks } = use('firebase-dynamic-links')

const uuid = require('uuid')
const moment = require('moment')
const { get, isArray, isEmpty, uniq, omit } = require('lodash')
const Promise = require('bluebird')

const Role = use('Role')
const Env = use('Env')
const Database = use('Database')
const DataStorage = use('DataStorage')
const User = use('App/Models/User')
const Tenant = use('App/Models/Tenant')
const Buddy = use('App/Models/Buddy')
const MailService = use('App/Services/MailService')
const AppException = use('App/Exceptions/AppException')
const HttpException = use('App/Exceptions/HttpException')
const SMSService = use('App/Services/SMSService')
const Logger = use('Logger')

const { getHash } = require('../Libs/utils.js')
const random = require('random')

const {
  STATUS_NEED_VERIFY,
  STATUS_EMAIL_VERIFY,
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  ROLE_USER,
  ROLE_LANDLORD,
  ROLE_PROPERTY_MANAGER,
  ROLE_HOUSEHOLD,
  MATCH_STATUS_FINISH,
  DATE_FORMAT,
  DEFAULT_LANG,
  BUDDY_STATUS_ACCEPTED,
  SMS_VERIFY_PREFIX,
  LOG_TYPE_SIGN_UP,
  SIGN_IN_METHOD_GOOGLE,
} = require('../constants')
const { logEvent } = require('./TrackingService.js')

class UserService {
  /**
   * Create user flow
   */
  static async createUser(userData) {
    const user = await User.createItem(userData)
    if (user.role === ROLE_USER) {
      try {
        // Create empty tenant and link to user
        const tenant = userData.signupData
        console.log('tenanttenant', tenant)
        await Tenant.createItem({
          user_id: user.id,
          coord: tenant.address.coord,
          dist_type: tenant.transport,
          dist_min: tenant.time,
          address: tenant.address.title,
        })
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

    let roles = [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER, ROLE_HOUSEHOLD]
    if (role) {
      roles = [role]
    }
    // Check is user same email another role is exists
    const existingUser = await User.query()
      .where('email', email)
      .whereIn('role', roles)
      .first()
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
      status: STATUS_NEED_VERIFY,
    }

    const { user } = await UserService.createUser(userData)

    logEvent(request, LOG_TYPE_SIGN_UP, user.uid, {
      role: user.role,
      email: user.email,
      method,
    })

    return user
  }

  /**
   *
   */
  static async changeEmail(user, email) {
    const code = uuid.v4(email, 'change_email')
    const trx = await Database.beginTransaction()
    try {
      user.email = email
      user.confirm = false
      user.save(trx)
      await DataStorage.setItem(code, { userId: user.id }, 'change_email', { ttl: 3600 })
      await MailService.sendChangeEmailConfirmation(email, code, user.role)
      trx.commit()
    } catch (e) {
      trx.rollback()
      throw e
    }
  }

  /**
   *
   */
  static async confirmChangeEmail(code) {
    const data = await DataStorage.getItem(code, 'change_email')
    const userId = get(data, 'userId')
    if (!userId) {
      throw new AppException('Invalid confirmation code')
    }

    await User.query().update({ confirm: true })
    await DataStorage.remove(code, 'change_email')
  }

  /**
   *
   */
  static async requestPasswordReset(email) {
    const code = getHash(3)
    const user = await User.findByOrFail({ email })
    await DataStorage.setItem(code, { userId: user.id }, 'reset_password', { ttl: 3600 })
    await MailService.sendResetPasswordMail(user.email, code)
  }

  /**
   *
   */

  static async requestSendCodeForgotPassword(email) {
    const code = getHash(3)
    let user = null
    try {
      user = await User.findByOrFail({ email })
      const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEB_KEY)

      const { shortLink } = await firebaseDynamicLinks.createLink({
        dynamicLinkInfo: {
          domainUriPrefix: process.env.DOMAIN_PREFIX,
          link: `${process.env.DEEP_LINK}?type=newpassword&code=${code}`,
          androidInfo: {
            androidPackageName: process.env.ANDROID_PACKAGE_NAME,
          },
          iosInfo: {
            iosBundleId: process.env.IOS_BUNDLE_ID,
          },
        },
      })
      await DataStorage.setItem(user.id, { code }, 'forget_password', { ttl: 3600 })

      const data = await this.getTokenWithLocale([user.id])
      const lang = data && data.length && data[0].lang?data[0].lang:user.lang
  
      await MailService.sendcodeForgotPasswordMail(user.email, shortLink, user.role, lang)
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
      throw new AppException('User with this email does not exist')
    }

    const data = await DataStorage.getItem(user.id, 'forget_password')
    const { code } = data || {}
    if (code !== codeSent) {
      throw new HttpException('Invalid confirmation code', 404)
    }

    user.password = password
    await user.save()
    await DataStorage.remove(user.id, 'forget_password')
  }

  /**
   * Reset password to all users with same email
   */
  static async resetPassword(code, password) {
    const data = await DataStorage.getItem(code, 'reset_password')
    const userId = get(data, 'userId')
    if (!userId) {
      throw new AppException('Invalid confirmation code')
    }

    const usersToUpdate = await User.query()
      .whereIn('email', function () {
        this.select('email').where('id', userId)
      })
      .limit(3)
      .fetch()

    if (!isEmpty(usersToUpdate.rows)) {
      await Promise.map(usersToUpdate.rows, (u) => u.updateItem({ password }, true))
    }

    await DataStorage.remove(code, 'reset_password')
  }

  /**
   *
   */
  static async updateUserRoles(user, rolesSlugs) {
    await user.roles().detach()

    if (isArray(rolesSlugs) && !isEmpty(rolesSlugs)) {
      const roleIds = (await Role.query().whereIn('slug', rolesSlugs).fetch()).rows.map((i) => i.id)

      await user.roles().attach(roleIds)
    }
  }

  /**
   *
   */
  static async sendConfirmEmail(user) {
    const date = String(new Date().getTime())
    const code = date.slice(date.length - 4, date.length)
    await DataStorage.setItem(user.id, { code }, 'confirm_email', { ttl: 3600 })
    const data = await UserService.getTokenWithLocale([user.id])
    const lang = data && data.length && data[0].lang?data[0].lang:user.lang;

    await MailService.sendUserConfirmation(user.email, {
      code,
      user_id: user.id,
      role: user.role,
      lang: lang,
    })
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
  static async confirmEmail(user, userCode) {
    // const data = await DataStorage.getItem(user.id, 'confirm_email')
    // const { code } = data || {}
    // if (code !== userCode) {
    //   throw new AppException('Invalid code')
    // }
    // // TODO: check user status active is allow
    // user.status = STATUS_ACTIVE
    // await DataStorage.remove(user.id, 'confirm_email')


    const localData = await UserService.getTokenWithLocale([user.id])
    const lang = localData && localData.length && localData[0].lang?localData[0].lang:user.lang;

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
console.log('short Link=', shortLink)
    await MailService.sendWelcomeMail(user.email, {
      code: shortLink,
      role: user.role,
      lang: lang,
    })    
    return user.save()
  }

  /**
   *
   */
  static async copyUser(user, role) {
    const { id, ...data } = auth.user.toJSON({ isOwner: true })
    const result = await UserService.createUser({
      ...data,
      password: String(new Date().getTime()),
      role,
    })
    // Copy password from origin
    await Database.raw(
      'UPDATE users SET password = (SELECT password FROM users WHERE id = ? LIMIT 1) WHERE id = ?',
      [result.user.id, id]
    )

    return result.user
  }

  /**
   * Get tenant for user or create if not exists
   */
  static async getOrCreateTenant(user) {
    if (user.role !== ROLE_USER) {
      throw new AppException('Invalid tenant user role')
    }
    const tenant = await Tenant.query().where('user_id', user.id).first()
    if (tenant) {
      return tenant
    }

    return Tenant.createItem({ user_id: user.id })
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
      .where({ 'users.id': userTenantId, 'users.role': ROLE_USER })
      .groupBy('users.id')
      .first()

    if (!user) {
      throw new AppException('User not exists')
    }

    let userData = user.toJSON({ publicOnly: !user.finish })
    userData.tenant = null
    // Get tenant extend data
    if (user.share || user.finish) {
      const tenantQuery = Tenant.query().where('user_id', user.id)
      if (user.share) {
        tenantQuery.with('members').with('members.incomes').with('members.incomes.proofs')
      }

      /** Updated by Yong */
      const tenant = await tenantQuery.first()
      if (!tenant) {
        return userData
      }

      let extraFields = Tenant.columns
      if (!tenant.personal_shown) {
        extraFields = Object.values(
          omit(extraFields, [
            'unpaid_rental',
            'insolvency_proceed',
            'arrest_warranty',
            'clean_procedure',
          ])
        )
      }

      if (!tenant.income_shown) {
        extraFields = Object.values(omit(extraFields, ['income']))
      }

      if (!tenant.residency_shown) {
        extraFields = Object.values(omit(extraFields, ['address', 'coord']))
      }

      if (!tenant.creditscore_shown) {
        extraFields = Object.values(omit(extraFields, ['credit_score']))
      }

      if (!tenant.solvency_shown) {
        extraFields = Object.values(omit(extraFields, ['income_seizure']))
      }

      /** End by Yong*/
      userData.tenant = tenant.toJSON({ isShort: true, extraFields: extraFields })

      if (!tenant.income_shown) {
        const members =
          userData.tenant.members &&
          userData.tenant.members.map((m) => {
            if (!tenant.income_shown) {
              delete m.incomes
            }
            if (!tenant.residency_shown) {
              delete m.last_address
            }
            if (!tenant.creditscore_shown) {
              delete m.credit_score
            }
            if (!tenant.solvency_shown) {
              delete m.income_seizure
            }
          })
        userData = {
          members,
          ...userData,
        }
      }

      if (!tenant.profile_shown || !tenant.personal_shown) {
        delete userData.tenant.members
      }
    }

    return userData
  }

  /**
   *
   */
  static async getLandlordInfo(landlordId, userTenantId) {
    const user = await User.query()
      .select('users.*')
      .select(Database.raw('? = ANY(ARRAY_AGG("_m"."status")) as finish', [MATCH_STATUS_FINISH]))
      .leftJoin({ _m: 'matches' }, function () {
        this.onIn('_m.user_id', [userTenantId])
          .onIn('_m.estate_id', function () {
            this.select('id').from('estates').where({ user_id: landlordId })
          })
          .on('_m.status', MATCH_STATUS_FINISH)
      })
      .where({ 'users.id': landlordId, 'users.role': ROLE_LANDLORD })
      .groupBy('users.id')
      .first()

    if (!user) {
      throw new AppException('User not exists')
    }

    return user.toJSON({ publicOnly: !user.finish })
  }

  /**
   *
   */
  static async landlordHasAccessTenant(landlordId, userTenantId) {
    const result = await Database.table({ _m: 'matches' })
      .select('_m.estate_id')
      .where({ '_m.user_id': userTenantId })
      .whereIn('_m.estate_id', function () {
        this.select('id').from('estates').where({ user_id: landlordId })
      })
      .where('_m.share', true)
      .first()

    return !!result
  }

  /**
   *
   */
  static async switchDeviceToken(id, email) {
    await Database.raw(
      'UPDATE users SET device_token = (SELECT device_token FROM users WHERE email = ? AND id != ? LIMIT 1) WHERE id = ?',
      [email, id, id]
    )
    await Database.raw('UPDATE users SET device_token = NULL WHERE email = ? AND id != ?', [
      email,
      id,
    ])
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
  static async getDeviceTokens(userIds) {
    if (isEmpty(userIds)) {
      return []
    }

    const data = await Database.table('users')
      .select('device_token')
      .whereIn('id', userIds)
      .whereNot('device_token', '')
      .whereNot('device_token', null)

    return data.map((i) => i.device_token)
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
        is_verified: is_verify,
        verified_by: adminId,
        verified_date: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      })
  }

  static async getByIdWithRole(ids, role) {
    return await User.query().whereIn('id', ids).where({ role: role }).pluck('id')
  }

  static async getByEmailWithRole(emails, role) {
    return await User.query()
      .select(['id', 'email'])
      .whereIn('email', emails)
      .where({ role: role })
      .fetch()
  }

  static async housekeeperSignup(ownerId, email, password, phone) {
    await User.query().where('id', ownerId).firstOrFail()

    const trx = await Database.beginTransaction()
    try {
      const user = await User.create(
        {
          email,
          role: ROLE_HOUSEHOLD,
          password,
          owner_id: ownerId,
          phone: phone,
          status: STATUS_EMAIL_VERIFY,
        },
        trx
      )

      UserService.sendSMS(user.id, phone)
      const data = await DataStorage.getItem(user.id, SMS_VERIFY_PREFIX)
      console.log('data=', data)
      await trx.commit()
      return user
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      return null
    }
  }

  static async sendSMS(userId, phone) {
    const code = random.int(1000, 9999)
    await DataStorage.setItem(userId, { code: code, count: 5 }, SMS_VERIFY_PREFIX, { ttl: 3600 })
    await SMSService.send(phone, code)
  }

  static async confirmSMS(email, phone, code) {
    const user = await User.query()
      .select('id')
      .where('email', email)
      .where('phone', phone)
      .firstOrFail()

    const data = await DataStorage.getItem(user.id, SMS_VERIFY_PREFIX)

    if (!data) {
      throw new HttpException('No code', 400)
    }

    if (parseInt(data.code) !== parseInt(code)) {
      await DataStorage.remove(user.id, SMS_VERIFY_PREFIX)

      if (parseInt(data.count) <= 0) {
        throw new HttpException('Your code invalid any more', 400)
      }

      await DataStorage.setItem(
        user.id,
        { code: data.code, count: parseInt(data.count) - 1 },
        SMS_VERIFY_PREFIX,
        { ttl: 3600 }
      )
      throw new HttpException('Not Correct', 400)
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
      throw new AppException('Wrong invitation link')
    }

    const { landlordId } = landlord

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
}

module.exports = UserService
