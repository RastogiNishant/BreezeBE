'use strict'

const appleSignIn = require('apple-signin-auth')
const { get, isEmpty } = require('lodash')

const HttpException = use('App/Exceptions/HttpException')
const User = use('App/Models/User')
const Member = use('App/Models/Member')

const Config = use('Config')
const UserService = use('App/Services/UserService')
const MemberService = use('App/Services/MemberService')
const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')
const MarketPlaceService = use('App/Services/MarketPlaceService')
const QueueService = use('App/Services/QueueService')
const { getAuthByRole } = require('../../Libs/utils')
const Database = use('Database')
const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_DELETE,
  ROLE_PROPERTY_MANAGER,
  LOG_TYPE_SIGN_IN,
  SIGN_IN_METHOD_GOOGLE,
  SIGN_IN_METHOD_APPLE,
  STATUS_EMAIL_VERIFY,
  STATUS_ACTIVE,
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')
const {
  exceptions: { INVALID_TOKEN, USER_NOT_EXIST, USER_UNIQUE, INVALID_USER_ROLE },
} = require('../../../app/exceptions')
class OAuthController {
  /**
   *
   */
  async googleAuth({ ally }) {
    await ally.driver('google').redirect()
  }

  /**
   *
   */
  async authorizeUser(email, role) {
    if (!Array.isArray(email)) {
      email = [email]
    }

    const query = User.query()
      .whereIn('email', email)
      .whereNot('status', STATUS_DELETE)
      .orderBy('updated_at', 'desc')
    if ([ROLE_LANDLORD, ROLE_USER, ROLE_PROPERTY_MANAGER].includes(role)) {
      query.where('role', role)
    } else {
      query.whereIn('role', [ROLE_LANDLORD, ROLE_USER, ROLE_PROPERTY_MANAGER])
    }
    const user = await query.first()
    if (!user && !role) {
      throw new HttpException(USER_NOT_EXIST, 412)
    }

    return user
  }

  /**
   * Login by OAuth token
   */
  async tokenAuth({ request, auth, response }) {
    let { token, role, ip } = request.all()
    ip = ip || request.ip()
    let ticket
    try {
      ticket = await UserService.verifyGoogleToken(token)
    } catch (e) {
      throw new HttpException(INVALID_TOKEN, 400)
    }
    const email = get(ticket, 'payload.email')
    const googleId = get(ticket, 'payload.sub')
    const emailPrefix = email.split(`@`)[0]
    const emailSuffix = email.split(`@`)[1]
    let anotherSameEmail = ''
    if (emailSuffix.includes('googlemail')) {
      anotherSameEmail = `${emailPrefix}@gmail.com`
    } else {
      anotherSameEmail = `${emailPrefix}@googlemail.com`
    }

    let user = await this.authorizeUser([email, anotherSameEmail], role)
    if (!user && [ROLE_LANDLORD, ROLE_USER, ROLE_PROPERTY_MANAGER].includes(role)) {
      try {
        const { name } = ticket.getPayload()
        const [firstname, secondname] = name.split(' ')
        user = await this.handleSignUp(
          request,
          { ...ticket.getPayload(), email, google_id: googleId, firstname, secondname },
          SIGN_IN_METHOD_GOOGLE
        )
      } catch (e) {
        throw new HttpException(e.message, 400)
      }
    }

    if (user) {
      return response.res(await this.handleLogin(request, auth, user, SIGN_IN_METHOD_GOOGLE))
    }

    throw new HttpException('Invalid role', 400)
  }

  async handleSignUp(request, payload, method) {
    let { device_token, role, code, invite_type, data1, data2, ip, ip_based_info } = request.all()

    let owner_id
    let member_id
    let is_household_invitation_onboarded = true
    let is_profile_onboarded = false

    if (code) {
      const member = await Member.query()
        .select('user_id', 'id')
        .where('email', email)
        .where('code', code)
        .firstOrFail()

      owner_id = member.user_id
      member_id = member.id
      is_household_invitation_onboarded = false
      is_profile_onboarded = true

      // Check user not exists
      const availableUser = await User.query()
        .where('role', ROLE_USER)
        .where('email', email)
        .first()
      if (availableUser) {
        throw new HttpException(USER_UNIQUE, 400)
      }
    }

    const user = await UserService.createUserFromOAuth(
      request,
      {
        ...payload,
        device_token,
        owner_id,
        role,
        is_household_invitation_onboarded,
        is_profile_onboarded,
        ip,
        ip_based_info,
        invite_type,
        data1,
        data2,
      },
      method
    )

    if (isEmpty(ip_based_info.country_code)) {
      QueueService.getIpBasedInfo(user.id, ip)
    }

    if (user && user.role === ROLE_USER && member_id) {
      await MemberService.setMemberOwner({
        member_id,
        firstname: payload.firstname,
        secondname: payload.secondname,
        owner_id: user.id,
      })
    }
    return user
  }

  async handleLogin(request, auth, user, method) {
    let { device_token, invite_type, data1, data2, ip, ip_based_info } = request.all()

    const authenticator = getAuthByRole(auth, user.role)
    if (user.status === STATUS_EMAIL_VERIFY) {
      await UserService.socialLoginAccountActive(user.id, { device_token, status: STATUS_ACTIVE })
    }
    const token = await authenticator.generate(user)
    const trx = await Database.beginTransaction()
    try {
      await UserService.handleOutsideInvitation(
        {
          user,
          email: user.email,
          invite_type,
          data1,
          data2,
        },
        trx
      )
      if (user.role === ROLE_USER) {
        await MarketPlaceService.createKnock({ user }, trx)
      }
      await trx.commit()
      MarketPlaceService.sendBulkKnockWebsocket(user.id)
    } catch (e) {
      console.log(`outside invitation error= ${invite_type}`, e.message)
      await trx.rollback()
      throw new HttpException(e.message, e.status || 500)
    }

    if (isEmpty(ip_based_info.country_code)) {
      const QueueService = require('../../Services/QueueService')
      QueueService.getIpBasedInfo(user.id, ip)
    }

    logEvent(request, LOG_TYPE_SIGN_IN, user.uid, {
      method,
      role: user.role,
      email: user.email,
    })

    return token
  }

  /**
   *
   */
  async tokenAuthApple({ request, auth, response }) {
    let { token, device_token, role, code, invite_type, data1, data2, ip, ip_based_info } =
      request.all()
    ip = ip || request.ip()
    const options = { audience: Config.get('services.apple.client_id') }
    let email
    try {
      const socialData = await appleSignIn.verifyIdToken(token, options)
      email = socialData.email
    } catch (e) {
      throw new HttpException(INVALID_TOKEN, 400)
    }
    let user = await this.authorizeUser(email, role)
    if (!user && [ROLE_LANDLORD, ROLE_USER, ROLE_PROPERTY_MANAGER].includes(role)) {
      try {
        user = await this.handleSignUp(
          request,
          { email, name: 'Apple User', firstname: 'User', secondname: 'Apple' },
          SIGN_IN_METHOD_APPLE
        )
      } catch (e) {
        throw new HttpException(e.message, 400)
      }
    }

    if (user) {
      return response.res(await this.handleLogin(request, auth, user, SIGN_IN_METHOD_GOOGLE))
    }

    throw new HttpException(INVALID_USER_ROLE, 400)
  }
}

module.exports = OAuthController
