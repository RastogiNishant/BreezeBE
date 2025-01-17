'use strict'
const _ = require('lodash')
const Event = use('Event')
const User = use('App/Models/User')
const Admin = use('App/Models/Admin')
const Database = use('Database')
const Logger = use('Logger')
const UserService = use('App/Services/UserService')
const TenantPremiumPlanService = use('App/Services/TenantPremiumPlanService')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')
const { pick } = require('lodash')
const QueueService = use('App/Services/QueueService')
const DataStorage = use('DataStorage')
const {
  exceptions: {
    USER_NOT_EXIST,
    USER_UNIQUE,
    USER_CLOSED,
    FAILED_UPLOAD_AVATAR,
    USER_WRONG_PASSWORD
  }
} = require('../../../app/exceptions')

const { getAuthByRole } = require('../../Libs/utils')
/** @type {typeof import('/providers/Static')} */

const {
  ROLE_LANDLORD,
  LOG_TYPE_SIGN_IN,
  SIGN_IN_METHOD_EMAIL,
  LOG_TYPE_SIGN_UP,
  LOG_TYPE_OPEN_APP,
  FRONTEND_USED_WEB,
  FRONTEND_USED_MOBILE,
  ROLE_USER,
  TEMPORARY_PASSWORD_PREFIX
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')

class AccountController {
  /**
   *
   */
  async signup({ request, response }) {
    const { email, from_web, data1, data2, invite_type, ip_based_info, ...userData } = request.all()
    const trx = await Database.beginTransaction()
    try {
      const user = await UserService.signUp(
        {
          email,
          from_web,
          data1,
          data2,
          invite_type,
          ip_based_info,
          ...userData
        },
        trx
      )
      await trx.commit()
      logEvent(request, LOG_TYPE_SIGN_UP, user.uid, {
        role: user.role,
        email: user.email
      })

      if (user.role === ROLE_USER) {
        QueueService.getTenantMatchProperties({
          userId: user.id,
          has_notification_sent: false
        })
      }

      await UserService.handleOutsideInvitation({
        user,
        email,
        invite_type,
        data1,
        data2
      })

      response.res(user)
    } catch (e) {
      await trx.rollback()
      if (e.constraint === 'users_uid_unique') {
        throw new HttpException(USER_UNIQUE, 400)
      }

      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  async housekeeperSignup({ request, response }) {
    const { firstname, email, secondname, password, code, lang, ip, ip_based_info } = request.all()
    try {
      const user = await UserService.housekeeperSignup({
        code,
        email,
        password,
        firstname,
        secondname,
        lang,
        ip,
        ip_based_info
      })

      response.res(user)
    } catch (e) {
      if (e.constraint === 'users_uid_unique') {
        throw new HttpException(USER_UNIQUE, 400)
      }
      throw e
    }
  }

  async checkSignUpConfirmBySMS({ request, response }) {
    const { email, phone, code } = request.all()
    try {
      await UserService.confirmSMS(email, phone, code)
      response.res(true)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async resendUserConfirm({ request, response }) {
    const { user_id, from_web } = request.all()
    try {
      const result = await UserService.resendUserConfirm(user_id, from_web)
      response.res(result)
    } catch (e) {
      throw new HttpException(e.message, e.status || e.code, e.code || 0)
    }
  }

  /**
   *
   */
  async confirmEmail({ request, auth, response }) {
    const { code, user_id, from_web } = request.all()
    let user
    try {
      user = await User.find(user_id)
      if (!user) {
        throw new HttpException(USER_NOT_EXIST, 400)
      }
      await UserService.confirmEmail(user, code, from_web)
      Event.fire('mautic:syncContact', user.id, { email_verification_date: new Date() })
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }
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
    response.res(token)
  }

  /**
   *
   */
  async login({ request, auth, response }) {
    try {
      const { email, role, password, device_token, from_web, landlord_email } = request.all()
      let user, token
      const loginResult = await UserService.login({ email, role, device_token })
      // TODO: implement test cases for admin login
      if (loginResult?.isAdmin) {
        const authenticator = auth.authenticator('jwtAdministrator')
        const uid = Admin.getHash(email)
        try {
          const token = await authenticator.attempt(uid, password)

          if (landlord_email) {
            try {
              const landlord = await UserService.login({ email: landlord_email, role })
              return response.res(await getAuthByRole(auth, ROLE_LANDLORD).generate(landlord))
            } catch (e) {
              throw new HttpException(e.message, e.status || 400)
            }
          } else {
            token.is_admin = true
            return response.res(token)
          }
        } catch (e) {
          const [message] = e.message.split(':')
          throw new HttpException(e.message || USER_WRONG_PASSWORD, e.status || 400, 0)
        }
      } else {
        user = loginResult
      }
      const authenticator = getAuthByRole(auth, role)
      const temporaryPassword = await DataStorage.getItem(user.id, TEMPORARY_PASSWORD_PREFIX)
      if (temporaryPassword && password === temporaryPassword) {
        token = await authenticator.generate(user)
        await DataStorage.remove(user.id, TEMPORARY_PASSWORD_PREFIX)
        return response.res(token)
      }

      const uid = User.getHash(email, role)
      try {
        token = await authenticator.attempt(uid, password)
      } catch (e) {
        const [message] = e.message.split(':')
        // FIXME: message should be json here to be consistent with being a backend
        // that provides JSON RESTful API
        throw new HttpException(USER_WRONG_PASSWORD, 400, 0)
      }
      const ip = request.ip()
      await UserService.setIpBasedInfo(user, ip)
      if (from_web) {
        user.frontend_used = FRONTEND_USED_WEB
      } else {
        user.frontend_used = FRONTEND_USED_MOBILE
      }
      await user.save()
      logEvent(request, LOG_TYPE_SIGN_IN, user.uid, {
        method: SIGN_IN_METHOD_EMAIL,
        role,
        email: user.email
      })

      return response.res(token)
    } catch (e) {
      throw e.status && e.code ? e : new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  /**
   *
   */
  async me({ auth, response, request }) {
    if (auth.current.user instanceof Admin) {
      return response.res({ ...auth.current.user.toJSON(), is_admin: true })
    }
    const { pushToken } = request.all()
    const user = await UserService.me(auth.current.user, pushToken)
    logEvent(request, LOG_TYPE_OPEN_APP, user.uid, {
      email: user.email,
      role: user.role
    })
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
    // TODO: check this endpoint response
    await UserService.closeAccount(auth.user)
    response.res({ message: USER_CLOSED })
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
    try {
      const user = await UserService.updateProfile(request, auth.user)
      response.res(user)
    } catch (e) {
      throw new HttpException(e.message, e.status || 400)
    }
  }

  /**
   *
   */
  async changePassword({ request, auth, response }) {
    const user = auth.current.user
    const { current_password, new_password } = request.all()
    await UserService.changePassword(user, current_password, new_password)
    return response.res(true)
  }

  async updateDeviceToken({ request, auth, response }) {
    const user = auth.current.user
    const { device_token } = request.all()
    try {
      const ret = await UserService.updateDeviceToken(user.id, device_token)
      response.res(ret)
    } catch (e) {
      throw new HttpException(e.message, e.status || 500)
    }
  }

  /**
   *
   */
  async updateAvatar({ request, auth, response }) {
    try {
      const user = await UserService.updateAvatar(request, auth.user)
      response.res(user)
    } catch (e) {
      throw new HttpException(FAILED_UPLOAD_AVATAR, 400)
    }
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

    return response.res(true)
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

  async resetUnreadNotificationCount({ auth, response }) {
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

      const ret = {
        status: false,
        data: {
          plan_id,
          payment_plan
        }
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
              'app'
            ])
          : null
      }
      response.res(data)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = AccountController
