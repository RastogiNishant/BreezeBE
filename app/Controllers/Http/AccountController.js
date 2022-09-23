'use strict'
const fs = require('fs')
const moment = require('moment')
const uuid = require('uuid')
const _ = require('lodash')
const Promise = require('bluebird')
const Event = use('Event')
const User = use('App/Models/User')
const Admin = use('App/Models/Admin')
const Member = use('App/Models/Member')
const EstateViewInvite = use('App/Models/EstateViewInvite')
const EstateViewInvitedUser = use('App/Models/EstateViewInvitedUser')
const EstateViewInvitedEmail = use('App/Models/EstateViewInvitedEmail')
const Company = use('App/Models/Company')
const Tenant = use('App/Models/Tenant')
const Buddy = use('App/Models/Buddy')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Hash = use('Hash')
const Drive = use('Drive')

const Database = use('Database')
const Logger = use('Logger')

const UserService = use('App/Services/UserService')
const ZendeskService = use('App/Services/ZendeskService')
const MemberService = use('App/Services/MemberService')
const ImageService = use('App/Services/ImageService')
const TenantPremiumPlanService = use('App/Services/TenantPremiumPlanService')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')
const { pick, trim } = require('lodash')

const { getAuthByRole } = require('../../Libs/utils')
/** @type {typeof import('/providers/Static')} */

const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_EMAIL_VERIFY,
  STATUS_DELETE,
  LOG_TYPE_SIGN_IN,
  SIGN_IN_METHOD_EMAIL,
  LOG_TYPE_SIGN_UP,
  LOG_TYPE_OPEN_APP,
  BUDDY_STATUS_PENDING,
  STATUS_ACTIVE,
  ERROR_USER_NOT_VERIFIED_LOGIN,
  USER_ACTIVATION_STATUS_ACTIVATED,
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')

class AccountController {
  /**
   *
   */
  async signup({ request, response }) {
    const { email, firstname, from_web, ...userData } = request.all()
    try {
      const user = await UserService.signUp({ email, firstname, from_web, ...userData })
      logEvent(request, LOG_TYPE_SIGN_UP, user.uid, {
        role: user.role,
        email: user.email,
      })
      response.res(user)
    } catch (e) {
      if (e.constraint === 'users_uid_unique') {
        throw new HttpException('User already exists', 400)
      }

      throw e
    }
  }

  async housekeeperSignup({ request, response }) {
    const { firstname, email, password, code, lang } = request.all()
    try {
      const member = await Member.query()
        .select('user_id', 'id')
        .where('email', email)
        .where('code', code)
        .firstOrFail()

      const member_id = member.id

      // if (owner_id.toString() !== member.user_id.toString()) {
      //   throw new HttpException('Not allowed', 400)
      // }

      // Check user not exists
      const availableUser = await User.query().where('email', email).first()
      if (availableUser) {
        throw new HttpException('User already exists, can be switched', 400)
      }

      const user = await UserService.housekeeperSignup(
        member.user_id,
        email,
        password,
        firstname,
        lang
      )

      if (user) {
        await MemberService.setMemberOwner(member_id, user.id)
      }
      Event.fire('mautic:createContact', user.id)
      return response.res(user)
    } catch (e) {
      if (e.constraint === 'users_uid_unique') {
        throw new HttpException('User already exists', 400)
      }
      throw e
    }
  }

  async resendUserConfirmBySMS({ request, response }) {
    const { email, phone, lang } = request.all()

    try {
      const availableUser = await User.query().select('id').where('email', email).first()
      if (!availableUser) {
        throw new HttpException("Your email doesn't exist", 400)
      }

      await UserService.sendSMS(availableUser.id, phone, lang)
      return response.res(true)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async checkSignUpConfirmBySMS({ request, response }) {
    const { email, phone, code } = request.all()
    try {
      await UserService.confirmSMS(email, phone, code)
      return response.res(true)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async resendUserConfirm({ request, response }) {
    const { user_id } = request.all()
    const result = await UserService.resendUserConfirm(user_id)

    return response.res(result)
  }

  /**
   *
   */
  async confirmEmail({ request, auth, response }) {
    const { code, user_id, from_web } = request.all()
    let user
    try {
      user = await User.findOrFail(user_id)
      await UserService.confirmEmail(user, code)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }

    Event.fire('mautic:syncContact', user.id, { email_verification_date: new Date() })

    if (!from_web) {
      return response.res(true)
    }

    let authenticator
    try {
      authenticator = getAuthByRole(auth, user.role)
    } catch (e) {
      throw new HttpException(e.message, 403)
    }
    const token = await authenticator.generate(user)
    return response.res(token)
  }

  /**
   *
   */
  async login({ request, auth, response }) {
    let { email, role, password, device_token } = request.all()

    // Select role if not set, (allows only for non-admin users)
    let user
    let authenticator
    let uid
    if (role === ROLE_LANDLORD) {
      //lets make this admin has a role of landlord for now
      user = await Admin.query()
        .select('admins.*')
        .select(Database.raw(`${ROLE_LANDLORD} as role`))
        .select(Database.raw(`true as is_admin`))
        .select(Database.raw(`${STATUS_ACTIVE} as status`))
        .select(Database.raw(`true as real_admin`))
        .where('email', email)
        .first()
    }
    if (!user) {
      user = await User.query()
        .select('users.*', Database.raw(`false as is_admin`))
        .where('email', email)
        .where('role', role)
        .first()
      uid = User.getHash(email, role)
    } else {
      authenticator = auth.authenticator('jwtAdministrator')
      uid = Admin.getHash(email)
    }

    if (!user) {
      throw new HttpException('User not found', 404)
    }
    if (user.status !== STATUS_ACTIVE) {
      await UserService.sendConfirmEmail(user)
      /* @description */
      // Merge error code and user id and send as a response
      // Because client needs user id to call verify code endpoint
      throw new HttpException(
        'User has not been verified yet',
        400,
        parseInt(`${ERROR_USER_NOT_VERIFIED_LOGIN}${user.id}`)
      )
    }
    try {
      if (!authenticator) {
        authenticator = getAuthByRole(auth, user.role)
      }
    } catch (e) {
      throw new HttpException(e.message, 403)
    }

    let token
    try {
      token = await authenticator.attempt(uid, password)
    } catch (e) {
      const [error, message] = e.message.split(':')
      throw new HttpException(message, 401)
    }
    if (!user.is_admin) {
      //we don't have device_token on admins table hence the test...
      await User.query().where({ email }).update({ device_token: null })
      if (device_token) {
        await User.query().where({ id: user.id }).update({ device_token })
      }
      logEvent(request, LOG_TYPE_SIGN_IN, user.uid, {
        method: SIGN_IN_METHOD_EMAIL,
        role,
        email: user.email,
      })
      Event.fire('mautic:syncContact', user.id, { last_signin_date: new Date() })
      token['is_admin'] = false
    } else {
      token['is_admin'] = true
    }
    return response.res(token)
  }

  /**
   *
   */
  async me({ auth, response, request }) {
    if (auth.current.user instanceof Admin) {
      let admin = JSON.parse(JSON.stringify(auth.current.user))
      admin.is_admin = true
      return response.res(admin)
    }
    let user = await User.query()
      .where('users.id', auth.current.user.id)
      .with('household')
      .with('plan')
      .with('company', function (query) {
        query.with('contacts')
      })
      .with('letter_template')
      .with('tenantPaymentPlan')
      .firstOrFail()

    const tenant = await Tenant.query()
      .where({ user_id: auth.current.user.owner_id ?? auth.current.user.id })
      .first()

    const { pushToken } = request.all()

    if (user) {
      if (pushToken && user.device_token !== pushToken) {
        await user.updateItem({ device_token: pushToken })
      }
      logEvent(request, LOG_TYPE_OPEN_APP, user.uid, {
        email: user.email,
        role: user.role,
      })

      if (user.role == ROLE_LANDLORD) {
        user.is_activated = user.activation_status == USER_ACTIVATION_STATUS_ACTIVATED
        user = UserService.setOnboardingStep(user)
      } else if (user.role == ROLE_USER) {
        user.has_final_match = await require('../../Services/MatchService').checkUserHasFinalMatch(
          user.id
        )
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

    return response.res(user)
  }

  /**
   *
   */
  async logout({ auth, response }) {
    if (!(auth.current.user instanceof Admin)) {
      await User.query().where('id', auth.user.id).update({ device_token: null })
    }
    return response.res()
  }

  /**
   *
   */
  async closeAccount({ auth, response }) {
    const user = await User.query().where('id', auth.user.id).first()
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
    user.save()

    return response.res({ message: 'User Account Closed' })
  }

  async onboard({ auth, response }) {
    const user = await User.query().where('id', auth.user.id).first()
    user.is_onboarded = true
    await user.save()
    return response.res(true)
  }

  async onboardProfile({ auth, response }) {
    const user = await User.query().where('id', auth.user.id).first()
    user.is_profile_onboarded = true
    await user.save()
    return response.res(true)
  }

  async onboardDashboard({ auth, response }) {
    const user = await User.query().where('id', auth.user.id).first()
    user.is_dashboard_onboarded = true
    await user.save()
    return response.res(true)
  }

  async onboardSelection({ auth, response }) {
    const user = await User.query().where('id', auth.user.id).first()
    user.is_selection_onboarded = true
    await user.save()
    return response.res(true)
  }

  async onboardLandlordVerification({ auth, response }) {
    const user = await User.query().where('id', auth.user.id).first()
    user.is_landlord_verification_onboarded = true
    await user.save()
    return response.res(true)
  }

  /**
   *
   */
  async updateProfile({ request, auth, response }) {
    const data = request.all()
    let user = auth.user
    auth.user.role === ROLE_USER
      ? delete data.landlord_visibility
      : auth.user.role === ROLE_LANDLORD
      ? delete data.prospect_visibility
      : data

    const trx = await Database.beginTransaction()
    let company

    try {
      if (request.header('content-type').match(/^multipart/)) {
        //this is an upload
        const fileSettings = { types: ['image'], size: '10mb' }
        const filename = `${uuid.v4()}.png`
        let avatarUrl, tmpFile

        request.multipart.file(`file`, fileSettings, async (file) => {
          tmpFile = await ImageService.resizeAvatar(file, filename)
          const sourceStream = fs.createReadStream(tmpFile)
          avatarUrl = await Drive.disk('s3public').put(
            `${moment().format('YYYYMM')}/${filename}`,
            sourceStream,
            { ACL: 'public-read', ContentType: 'image/png' }
          )
        })

        await request.multipart.process()

        if (!avatarUrl) {
          throw new HttpException('No file uploaded.')
        }

        user.avatar = avatarUrl
        await user.save(trx)

        user = user.toJSON({ isOwner: true })
      } else if (data.email) {
        /**
         * TODO:
         * Do we need to update email????? if so we need 2 verifacations below
         * Email unique checking,
         * If new email, need to validate
         */
        user.email = data.email
        await user.save(trx)

        user = user.toJSON({ isOwner: true })
      } else {
        if (data.company_name && data.company_name.trim()) {
          let company_name = data.company_name.trim()
          company = await Company.findOrCreate(
            { name: company_name, user_id: auth.user.id },
            { name: company_name, user_id: auth.user.id }
          )
          _.unset(data, 'company_name')
          data.company_id = company.id
        }

        await user.updateItemWithTrx(data, trx)
        user = user.toJSON({ isOwner: true })
      }

      user.company = null

      if (user.company_id) {
        company = await Company.query().where('id', user.company_id).with('contacts').first()
        user.company = company
      }

      if (data.email || data.sex || data.secondname) {
        let ect = {}

        if (data.email) ect.email = data.email

        if (data.sex) {
          ect.salutation = data.sex === 1 ? 'Mr.' : data.sex === 2 ? 'Ms.' : 'Mx.'
          ect.salutation_int = data.sex
        }

        if (data.secondname) ect.surname = data.secondname

        await EstateCurrentTenant.query().where('user_id', user.id).update(ect).transacting(trx)
      }
      user = UserService.setOnboardingStep(user)

      Event.fire('mautic:syncContact', user.id)
      await trx.commit()
      response.res(user)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 501)
    }
  }

  /**
   *
   */
  async changePassword({ request, auth, response }) {
    const user = auth.current.user
    const { current_password, new_password } = request.all()
    const verifyPassword = await Hash.verify(current_password, user.password)

    if (!verifyPassword) {
      throw new HttpException('Current password could not be verified! Please try again.', 400)
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

    return response.res(true)
  }

  async updateDeviceToken({ request, auth, response }) {
    const user = auth.current.user
    const { device_token } = request.all()
    try {
      const ret = await UserService.updateDeviceToken(user.id, device_token)
      response.res(ret)
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  /**
   *
   */
  async updateAvatar({ request, auth, response }) {
    const fileSettings = { types: ['image'], size: '10mb' }
    const filename = `${uuid.v4()}.png`
    let avatarUrl, tmpFile

    request.multipart.file(`file`, fileSettings, async (file) => {
      tmpFile = await ImageService.resizeAvatar(file, filename)
      const sourceStream = fs.createReadStream(tmpFile)
      avatarUrl = await Drive.disk('s3public').put(
        `${moment().format('YYYYMM')}/${filename}`,
        sourceStream,
        { ACL: 'public-read', ContentType: 'image/png' }
      )
    })

    await request.multipart.process()
    if (avatarUrl) {
      auth.user.avatar = avatarUrl
      await auth.user.save()
    }
    fs.unlink(tmpFile, () => {})

    response.res(auth.user)
  }

  /**
   *  send email with code for forget Password
   */
  async sendCodeForgotPassword({ request, response }) {
    const { email, from_web, lang } = request.only(['email', 'from_web', 'lang'])

    try {
      await UserService.requestSendCodeForgotPassword(email, lang, from_web)
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }

    return response.res()
  }

  /**
   *  setemail with code for forget Password
   */
  async setPasswordForgotPassword({ request, response }) {
    const { email, password, code } = request.only(['email', 'password', 'code'])

    try {
      await UserService.requestSetPasswordForgotPassword(email, password, code)
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }

    return response.res()
  }

  /**
   *
   */
  async switchAccount({ auth, response }) {
    const roleToSwitch = auth.user.role === ROLE_USER ? ROLE_LANDLORD : ROLE_USER
    let userTarget = await User.query()
      .where('email', auth.user.email)
      .where('role', roleToSwitch)
      .first()

    const { id, ...data } = auth.user.toJSON({ isOwner: true })
    if (!userTarget) {
      const { user } = await UserService.createUser({
        ...data,
        password: String(new Date().getTime()),
        role: roleToSwitch,
      })
      // Direct copy user password
      await Database.raw(
        'UPDATE users set password = (SELECT password FROM users WHERE id = ? LIMIT 1) WHERE id = ?',
        [id, user.id]
      )

      userTarget = user
    }
    let authenticator
    try {
      authenticator = getAuthByRole(auth, roleToSwitch)
    } catch (e) {
      throw new HttpException(e.message, 403)
    }
    const token = await authenticator.generate(userTarget)
    // Switch device_token
    await UserService.switchDeviceToken(userTarget.id, userTarget.email)

    response.res(token)
  }

  /**
   *
   */
  async getTenantProfile({ request, auth, response }) {
    const { id } = request.all()
    try {
      const user = await UserService.getTenantInfo(id, auth.user.id)
      return response.res(user)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async getLandlordProfile({ request, auth, response }) {
    const { id } = request.all()
    try {
      const user = await UserService.getLandlordInfo(id, auth.user.id)
      return response.res(user)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }
  }

  async resetUnreadNotificationCount({ request, auth, response }) {
    try {
      await UserService.resetUnreadNotificationCount(auth.user.id)
      return response.send(200)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }
  }

  async updateTenantPremiumPlan({ request, auth, response }) {
    const trx = await Database.beginTransaction()
    try {
      const { plan_id, payment_plan, receipt, app } = request.all()

      let ret = {
        status: false,
        data: {
          plan_id: plan_id,
          payment_plan: payment_plan,
        },
      }
      const purchase = await TenantPremiumPlanService.processPurchase(
        auth.user.id,
        plan_id,
        payment_plan,
        app,
        receipt,
        trx
      )
      await trx.commit()

      if (purchase) {
        const user = await User.query()
          .select(['id', 'plan_id', 'payment_plan'])
          .where('users.id', auth.current.user.id)
          .with('plan', function (p) {
            p.with('features', function (f) {
              f.whereNot('role_id', ROLE_LANDLORD)
              f.orderBy('id', 'asc')
            })
          })
          .with('tenantPaymentPlan')
          .firstOrFail()

        response.res(user)
      } else {
        throw new AppException('Not valid receipt', 400)
      }
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      throw new AppException(e, 400)
    }
  }

  async getTenantPremiumPlans({ request, auth, response }) {
    try {
      const { app } = request.all()
      const tenantPremiumPlans = await TenantPremiumPlanService.getTenantPremiumPlans(
        auth.user.id,
        app
      )
      const data = {
        purchase: tenantPremiumPlans
          ? pick(tenantPremiumPlans.toJSON(), [
              'id',
              'plan_id',
              'isCancelled',
              'startDate',
              'endDate',
              'app',
            ])
          : null,
      }
      response.res(data)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = AccountController
