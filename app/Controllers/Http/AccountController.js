'use strict'
const fs = require('fs')
const moment = require('moment')
const uuid = require('uuid')
const _ = require('lodash')
const Promise = require('bluebird')

const User = use('App/Models/User')
const Member = use('App/Models/Member')
const EstateViewInvite = use('App/Models/EstateViewInvite')
const EstateViewInvitedUser = use('App/Models/EstateViewInvitedUser')
const EstateViewInvitedEmail = use('App/Models/EstateViewInvitedEmail')
const Company = use('App/Models/Company')
const Tenant = use('App/Models/Tenant')
const Buddy = use('App/Models/Buddy')
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
const { assign, upperCase, pick } = require('lodash')

const { getAuthByRole } = require('../../Libs/utils')
/** @type {typeof import('/providers/Static')} */

const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_EMAIL_VERIFY,
  STATUS_DELETE,
  ROLE_PROPERTY_MANAGER,
  LOG_TYPE_SIGN_IN,
  SIGN_IN_METHOD_EMAIL,
  LOG_TYPE_SIGN_UP,
  LOG_TYPE_OPEN_APP,
  BUDDY_STATUS_PENDING,
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')

class AccountController {
  /**
   *
   */
  async signup({ request, response }) {
    const { email, firstname, ...userData } = request.all()
    let roles = [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER]
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

  /**
   * Signup prospect with code we email to him.
   */
  async signupProspectWithViewEstateInvitation({ request, response }) {
    //create user
    const { email, phone, role, password, ...userData } = request.all()
    const trx = await Database.beginTransaction()
    try {
      //add this user
      let user = await User.create(
        { ...userData, email, phone, role, password, status: STATUS_EMAIL_VERIFY },
        trx
      )
      if (role === ROLE_USER) {
        await Tenant.create(
          {
            user_id: user.id,
          },
          trx
        )
      }
      //include him on estate_view_invited_users with sticky set to true
      //this will add him even if he's not invited.
      //Probably a situation where he has mail forwarded from a different email
      const invitedUser = new EstateViewInvitedUser()
      invitedUser.user_id = user.id
      invitedUser.sticky = true
      invitedUser.estate_view_invite_id = request.estate_view_invite_id
      await invitedUser.save(trx)

      //lets find other estates he's invited to view
      const myInvitesToViewEstates = await EstateViewInvitedEmail.query()
        .where('email', email)
        .fetch()
      await Promise.all(
        myInvitesToViewEstates.toJSON().map(async (invite) => {
          await EstateViewInvitedUser.findOrCreate(
            { user_id: user.id, estate_view_invite_id: invite.estate_view_invite_id },
            { user_id: user.id, estate_view_invite_id: invite.estate_view_invite_id },
            trx
          )
        })
      )
      //send email for confirmation
      await UserService.sendConfirmEmail(user)
      trx.commit()
      return response.res(true)
    } catch (e) {
      console.log(e)
      await trx.rollback()
      throw new HttpException('Signup failed.', 412)
    }
  }

  /**
   * Signup user with hash
   */
  async signupProspectWithHash({ request, response }) {
    //create user
    const { email, phone, role, password, ...userData } = request.all()
    const trx = await Database.beginTransaction()
    try {
      //add this user
      let user = await User.create(
        { ...userData, email, phone, role, password, status: STATUS_EMAIL_VERIFY },
        trx
      )
      let tenant
      if (role === ROLE_USER) {
        if (userData.signupData) {
          tenant = await Tenant.findOrCreate(
            { user_id: user.id },
            {
              user_id: user.id,
              coord: userData.signupData.address.coord,
              dist_type: userData.signupData.transport,
              dist_min: userData.signupData.time,
              address: userData.signupData.address.title,
            }
          )
        } else {
          tenant = await Tenant.findOrCreate({ user_id: user.id }, { user_id: user.id }, trx)
        }
      }
      //add to estate_view_invites
      let invitation = await EstateViewInvite.findOrCreate(
        { code: request.estate.hash },
        {
          invited_by: request.estate.user_id,
          estate_id: request.estate.id,
          code: request.estate.hash,
        },
        trx
      )
      //include him on estate_view_invited_users with sticky set to true
      const invitedUser = new EstateViewInvitedUser()
      invitedUser.user_id = user.id
      invitedUser.sticky = true
      invitedUser.estate_view_invite_id = invitation.id
      await invitedUser.save(trx)
      //lets find other estates he's invited to view
      const myInvitesToViewEstates = await EstateViewInvitedEmail.query()
        .where('email', email)
        .fetch()
      await Promise.all(
        myInvitesToViewEstates.toJSON().map(async (invite) => {
          await EstateViewInvitedUser.findOrCreate(
            { user_id: user.id, estate_view_invite_id: invite.estate_view_invite_id },
            { user_id: user.id, estate_view_invite_id: invite.estate_view_invite_id },
            trx
          )
        })
      )
      //add user to buddies
      await Buddy.create({
        user_id: invitation.invited_by,
        email,
        phone,
        tenant_id: tenant.id,
        status: BUDDY_STATUS_PENDING,
      })
      //send email for confirmation
      await UserService.sendConfirmEmail(user)
      trx.commit()
      return response.res(true)
    } catch (e) {
      console.log(e)
      await trx.rollback()
      throw new HttpException('Signup failed.', 412)
    }
  }

  async housekeeperSignup({ request, response }) {
    const { firstname, email, password, code, lang } = request.all()
    console.log({ code })
    console.log({ email, code })
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

      // if (password !== confirmPassword) {
      //   throw new HttpException('Password not matched', 400)
      // }

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
    let roles = [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER]
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

  async createZendeskToken({ request, auth, response }) {
    try {
      const user = await User.query().where('users.id', auth.current.user.id).firstOrFail()
      const token = await ZendeskService.createToken(
        user.id,
        user.email,
        `${user.firstname} ${user.lastname}`
      )
      return response.res(token)
    } catch (e) {
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
      .with('tenantPaymentPlan')
      .firstOrFail()

    if (user) {
      logEvent(request, LOG_TYPE_OPEN_APP, user.uid, {
        email: user.email,
        role: user.role,
      })
      if (!user.company_id) {
        user.company_name = `${user.firstname} ${user.secondname}`.trim()
      } else {
        let company = await Company.query().where('id', user.company_id).first()
        user.company = company
        user.company_name = company.name
      }
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
    let user = auth.user

    auth.user.role === ROLE_USER
      ? delete data.landlord_visibility
      : auth.user.role === ROLE_LANDLORD
      ? delete data.prospect_visibility
      : data

    let company
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
      } else {
        auth.user.avatar = avatarUrl
        await auth.user.save()
        fs.unlink(tmpFile, () => {})
      }
      user = await User.find(auth.user.id)
      user.avatar = avatarUrl
      await user.save()
      user = user.toJSON({ isOwner: true })
    } else if (data.email) {
      user = await User.find(auth.user.id)
      user.email = data.email
      await user.save()
      user = user.toJSON({ isOwner: true })
    } else {
      if (data.company_name) {
        let company_name = data.company_name
        company = await Company.findOrCreate(
          { name: company_name, user_id: auth.user.id },
          { name: company_name, user_id: auth.user.id }
        )
        _.unset(data, 'company_name')
        data.company_id = company.id
      }
      await user.updateItem(data)
      user = user.toJSON({ isOwner: true })
    }
    if (user.company_id) {
      company = await Company.query().where('id', user.company_id).first()
      user.company_name = company.name
      user.company = company
    } else {
      user.company = `${user.firstname} ${user.secondname}`.trim()
    }
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
   * Password recover send email with code
   */
  async passwordReset({ request, response }) {
    const { email, from_web } = request.only(['email', 'from_web'])
    // Send email with reset password code
    //await UserService.requestPasswordReset(email)
    if (from_web === undefined) {
      from_web = false
    }
    await UserService.requestSendCodeForgotPassword(email)
    return response.res()
  }

  /**
   *  send email with code for forget Password
   */
  async sendCodeForgotPassword({ request, response }) {
    const { email, from_web } = request.only(['email', 'from_web'])

    try {
      await UserService.requestSendCodeForgotPassword(email, from_web)
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
    return response.res({ email, password, code })
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
      trx.commit()

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
