'use strict'
const fs = require('fs')
const moment = require('moment')
const uuid = require('uuid')
const Promise = require('bluebird')

const User = use('App/Models/User')
const Member = use('App/Models/Member')
const Hash = use('Hash')
const Drive = use('Drive')

const Database = use('Database')
const Logger = use('Logger')

const UserService = use('App/Services/UserService')
const ZendeskService = use('App/Services/ZendeskService')
const MemberService = use('App/Services/MemberService')
const ImageService = use('App/Services/ImageService')
const UserPremiumPlanService = use('App/Services/UserPremiumPlanService')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')
const { assign } = require('lodash')

const { getAuthByRole } = require('../../Libs/utils')
/** @type {typeof import('/providers/Static')} */

const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_EMAIL_VERIFY,
  STATUS_DELETE,
  ROLE_ADMIN,
  PREMIUM_MEMBER,
  YEARLY_DISCOUNT_RATE,
  ROLE_PROPERTY_MANAGER,
  ROLE_HOUSEKEEPER,
  LOG_TYPE_SIGN_IN,
  SIGN_IN_METHOD_EMAIL,
  LOG_TYPE_SIGN_UP,
  LOG_TYPE_OPEN_APP,
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')

class AccountController {
  /**
   *
   */
  async signup({ request, response }) {
    const { email, firstname, ...userData } = request.all()
    let roles = [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER, ROLE_HOUSEKEEPER]
    const role = userData.role
    if (!roles.includes(role)) {
      throw new HttpException('Invalid user role', 401)
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
      throw new HttpException('User already exists, can be switched', 400)
    }

    try {
      const { user } = await UserService.createUser({
        ...userData,
        email,
        firstname,
        status: STATUS_EMAIL_VERIFY,
      })
      logEvent(request, LOG_TYPE_SIGN_UP, user.uid, {
        role: user.role,
        email: user.email,
      })

      await UserService.sendConfirmEmail(user)
      return response.res(user)
    } catch (e) {
      if (e.constraint === 'users_uid_unique') {
        throw new HttpException('User already exists', 400)
      }

      throw e
    }
  }

  async housekeeperSignup({ request, response }) {
    const { email, owner_id, password, code, member_id, confirmPassword, phone } = request.all()

    try {
      const member = await Member.query()
        .select('user_id')
        .where('id', member_id)
        .where('code', code)
        .firstOrFail()

      if (owner_id.toString() !== member.user_id.toString()) {
        throw new HttpException('Not allowed', 400)
      }
      // Check user not exists
      const availableUser = await User.query()
          .where('role', ROLE_HOUSEKEEPER )
          .where('email', email).first()
      if (availableUser) {
        throw new HttpException('User already exists, can be switched', 400)
      }

      if (password !== confirmPassword) {
        throw new HttpException('Password not matched', 400)
      }

      const user = await UserService.housekeeperSignup(member.user_id, email, password, phone)
      if( user ) {
        await MemberService.setMemberOwner(member_id, user.id)
      }
      return response.res(user)
    } catch (e) {
      if (e.constraint === 'users_uid_unique') {
        throw new HttpException('User already exists', 400)
      }
      throw e
    }
  }

  async resendUserConfirmBySMS({ request, response }) {
    const { email, phone } = request.all()

    try {
      const availableUser = await User.query().select('id').where('email', email).first()
      if (!availableUser) {
        throw new HttpException("Your email doesn't exist", 400)
      }

      await UserService.sendSMS(availableUser.id, phone)
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
  async confirmEmail({ request, response }) {
    const { code, user_id } = request.all()
    const user = await User.findOrFail(user_id)
    try {
      await UserService.confirmEmail(user, code)
    } catch (e) {
      Logger.error(e)
      throw new HttpException(e.message, 400)
    }

    return response.res(true)
  }

  /**
   *
   */
  async login({ request, auth, response }) {
    let { email, role, password, device_token } = request.all()

    // Select role if not set, (allows only for non-admin users)
    let roles = [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER, ROLE_HOUSEKEEPER]
    if (role) {
      roles = [role]
    }

    const user = await User.query()
      .where('email', email)
      .whereIn('role', roles)
      .orderBy('updated_at', 'desc')
      .first()
    if (!user) {
      throw new HttpException('User not found', 404)
    }
    role = user.role

    let authenticator
    try {
      authenticator = getAuthByRole(auth, role)
    } catch (e) {
      throw new HttpException(e.message, 403)
    }
    const uid = User.getHash(email, role)
    let token
    try {
      token = await authenticator.attempt(uid, password)
    } catch (e) {
      const [error, message] = e.message.split(':')
      throw new HttpException(message, 401)
    }

    await User.query().where({ email }).update({ device_token: null })
    if (device_token) {
      await User.query().where({ id: user.id }).update({ device_token })
    }
    logEvent(request, LOG_TYPE_SIGN_IN, user.uid, {
      method: SIGN_IN_METHOD_EMAIL,
      role,
      email: user.email,
    })
    return response.res(token)
  }

  async createZendeskToken({request, auth, response }){
    try{
      const user = await User.query()
      .where('users.id', auth.current.user.id)
      .firstOrFail()
      const token = await ZendeskService.createToken(user.id, user.email, `${user.firstname} ${user.lastname}` )
      return response.res(token)
    }catch(e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async me({ auth, response, request }) {
    const user = await User.query()
      .where('users.id', auth.current.user.id)
      .with('tenant')
      .with('household')
      .with('plan')
      .firstOrFail()

    if (user) {
      logEvent(request, LOG_TYPE_OPEN_APP, user.uid, {
        email: user.email,
        role: user.role,
      })
    }

    return response.res(user.toJSON({ isOwner: true }))
  }

  /**
   *
   */
  async logout({ auth, response }) {
    await User.query().where('id', auth.user.id).update({ device_token: null })
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

  /**
   *
   */
  async updateProfile({ request, auth, response }) {
    const data = request.all()
    const user = auth.user

    auth.user.role === ROLE_USER
      ? delete data.landlord_visibility
      : auth.user.role === ROLE_LANDLORD
      ? delete data.prospect_visibility
      : data

    await user.updateItem(data)
    return response.res(user)
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
   * Password recover send email with code
   */
  async passwordReset({ request, response }) {
    const { email } = request.only(['email'])
    // Send email with reset password code
    //await UserService.requestPasswordReset(email)
    await UserService.requestSendCodeForgotPassword(email)
    return response.res()
  }

  /**
   *  send email with code for forget Password
   */
  async sendCodeForgotPassword({ request, response }) {
    const { email } = request.only(['email'])

    try {
      await UserService.requestSendCodeForgotPassword(email)
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
   * Confirm user password change with secret code
   */
  async passwordConfirm({ request, response }) {
    const { code, password } = request.only(['code', 'password'])
    try {
      await UserService.resetPassword(code, password)
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

  async updateUserPremiumPlan({ request, auth, response }) {
    const trx = await Database.beginTransaction()
    try {
      const { plan_id, payment_plan, receipt } = request.all()

      let ret = {
        status: false,
        data: {
          plan_id: plan_id,
          payment_plan: payment_plan,
        },
      }

      await UserPremiumPlanService.updateUserPremiumPlans(auth.user.id, plan_id, receipt, trx)
      await UserService.updatePaymentPlan(auth.user.id, plan_id, payment_plan, trx)
      trx.commit()
      assign(ret.data, { payment_plan: payment_plan })
      assign(ret.data, { year_discount_rate: YEARLY_DISCOUNT_RATE })

      ret.status = true

      return response.send(ret)
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      // throw new AppException(e.message, 400)
    }
  }

  async getUserPremiumPlans({ request, auth, response }) {
    try {
      const userPremiumPlans = await UserPremiumPlanService.getUserPremiumPlans(auth.user.id)
      return response.send(userPremiumPlans)
    } catch (e) {
      Logger.error(e)
    }
  }
}

module.exports = AccountController
