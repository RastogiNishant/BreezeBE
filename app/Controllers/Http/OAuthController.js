'use strict'

const appleSignIn = require('apple-signin-auth')
const { get } = require('lodash')

const HttpException = use('App/Exceptions/HttpException')
const User = use('App/Models/User')
const Member = use('App/Models/Member')

const Config = use('Config')
const GoogleAuth = use('GoogleAuth')
const UserService = use('App/Services/UserService')
const MemberService = use('App/Services/MemberService')
const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')

const { getAuthByRole } = require('../../Libs/utils')

const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_DELETE,
  ROLE_PROPERTY_MANAGER,
  LOG_TYPE_SIGN_IN,
  SIGN_IN_METHOD_GOOGLE,
  SIGN_IN_METHOD_APPLE,
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')
const {
  exceptions: { INVALID_TOKEN, USER_NOT_EXIST, USER_UNIQUE, INVALID_USER_ROLE },
} = require('../../../app/excepions')
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
    const { token, device_token, role, code, data1, data2 } = request.all()
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

    let owner_id
    let member_id
    let is_household_invitation_onboarded = true
    let is_profile_onboarded = false

    if (!user && [ROLE_LANDLORD, ROLE_USER, ROLE_PROPERTY_MANAGER].includes(role)) {
      try {
        if (code) {
          const member = await Member.query()
            .select('user_id', 'id')
            .whereIn('email', [email, anotherSameEmail])
            .where('code', code)
            .firstOrFail()

          owner_id = member.user_id
          member_id = member.id
          is_household_invitation_onboarded = false
          is_profile_onboarded = true

          // Check user not exists
          const availableUser = await User.query()
            .where('role', ROLE_USER)
            .whereIn('email', [email, anotherSameEmail])
            .first()
          if (availableUser) {
            throw new HttpException(USER_UNIQUE, 400)
          }
        }

        user = await UserService.createUserFromOAuth(request, {
          ...ticket.getPayload(),
          google_id: googleId,
          device_token,
          role,
          owner_id,
          is_household_invitation_onboarded,
          is_profile_onboarded,
        })
      } catch (e) {
        throw new HttpException(e.message, 400)
      }
    }

    if (user) {
      const authenticator = getAuthByRole(auth, user.role)
      const token = await authenticator.generate(user)
      if (data1 && data2) {
        await EstateCurrentTenantService.acceptOutsideTenant({
          data1,
          data2,
          email,
          user,
        })
      }
      logEvent(request, LOG_TYPE_SIGN_IN, user.uid, {
        method: SIGN_IN_METHOD_GOOGLE,
        role: user.role,
        email: user.email,
      })
      if (member_id) {
        await MemberService.setMemberOwner(member_id, user.id)
      }

      return response.res(token)
    }

    throw new HttpException('Invalid role', 400)
  }

  /**
   *
   */
  async tokenAuthApple({ request, auth, response }) {
    const { token, device_token, role, code, data1, data2 } = request.all()
    const options = { audience: Config.get('services.apple.client_id') }
    let email
    try {
      const socialData = await appleSignIn.verifyIdToken(token, options)
      email = socialData.email
    } catch (e) {
      throw new HttpException(INVALID_TOKEN, 400)
    }
    let user = await this.authorizeUser(email, role)

    let owner_id
    let member_id
    let is_household_invitation_onboarded = true
    let is_profile_onboarded = false

    if (!user && [ROLE_LANDLORD, ROLE_USER, ROLE_PROPERTY_MANAGER].includes(role)) {
      try {
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

        user = await UserService.createUserFromOAuth(
          request,
          {
            email,
            device_token,
            owner_id,
            role,
            name: 'Apple User',
            is_household_invitation_onboarded,
            is_profile_onboarded,
          },
          SIGN_IN_METHOD_APPLE
        )

        if (user && member_id) {
          await MemberService.setMemberOwner(member_id, user.id)
        }
      } catch (e) {
        throw new HttpException(e.message, 400)
      }
    }

    if (user) {
      const authenticator = getAuthByRole(auth, user.role)
      const token = await authenticator.generate(user)
      if (data1 && data2) {
        await EstateCurrentTenantService.acceptOutsideTenant({
          data1,
          data2,
          email,
          user,
        })
      }
      logEvent(request, LOG_TYPE_SIGN_IN, user.uid, {
        method: SIGN_IN_METHOD_APPLE,
        role: user.role,
        email: user.email,
      })
      return response.res(token)
    }

    throw new HttpException(INVALID_USER_ROLE, 400)
  }
}

module.exports = OAuthController
