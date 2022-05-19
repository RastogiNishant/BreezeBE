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
const { getAuthByRole } = require('../../Libs/utils')

const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_DELETE,
  ROLE_PROPERTY_MANAGER,
  LOG_TYPE_SIGN_IN,
  SIGN_IN_METHOD_GOOGLE,
  SIGN_IN_METHOD_APPLE,
  LOG_TYPE_SIGN_UP,
} = require('../../constants')
const { logEvent } = require('../../Services/TrackingService')

class OAuthController {
  /**
   *
   */
  async googleAuth({ ally }) {
    await ally.driver('google').redirect()
  }

  /**
   * Login with web client
   */
  async googleAuthConfirm({ request, ally, auth, response }) {
    let authUser
    try {
      authUser = await ally.driver('google').getUser()
    } catch (e) {
      throw new HttpException('Invalid user', 400)
    }

    const { id, email } = authUser.toJSON({ isOwner: true })
    let user = await User.query()
      .where('email', email)
      .whereIn('role', [ROLE_LANDLORD])
      .whereNot('status', STATUS_DELETE)
      .first()

    // Create user if not exists
    if (!user) {
      try {
        user = await UserService.createUserFromOAuth(request, {
          ...authUser.toJSON({ isOwner: true }),
          role: ROLE_LANDLORD,
          google_id: id,
        })
      } catch (e) {
        throw new HttpException(e.message, 400)
      }
    }

    // Auth user
    if (user) {
      const authenticator = getAuthByRole(auth, user.role)
      const token = await authenticator.generate(user)

      return response.res(token)
    }

    throw new new HttpException('Invalid user', 400)()
  }

  /**
   *
   */
  async authorizeUser(email, role) {
    const query = User.query()
      .where('email', email)
      .whereNot('status', STATUS_DELETE)
      .orderBy('updated_at', 'desc')
    if ([ROLE_LANDLORD, ROLE_USER, ROLE_PROPERTY_MANAGER].includes(role)) {
      query.where('role', role)
    } else {
      query.whereIn('role', [ROLE_LANDLORD, ROLE_USER, ROLE_PROPERTY_MANAGER])
    }
    const user = await query.first()
    if (!user && !role) {
      throw new HttpException('User not exists', 412)
    }

    return user
  }

  /**
   * Login by OAuth token
   */
  async tokenAuth({ request, auth, response }) {
    const { token, device_token, role, code } = request.all()
    let ticket
    try {
      ticket = await GoogleAuth.verifyIdToken({
        idToken: token,
        audience: Config.get('services.ally.google.client_id'),
      })
    } catch (e) {
      throw new HttpException('Invalid token', 400)
    }

    const email = get(ticket, 'payload.email')
    const googleId = get(ticket, 'payload.sub')
    let user = await this.authorizeUser(email, role)

    let owner_id
    let member_id
    let is_household_invitation_onboarded = true
    let is_profile_onboarded = false

    if (!user && [ROLE_LANDLORD, ROLE_USER, ROLE_PROPERTY_MANAGER].includes(role)) {
      console.log({ code })
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
            throw new HttpException('User already exists, can be switched', 400)
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

    console.log('çıktı')

    if (user) {
      const authenticator = getAuthByRole(auth, user.role)
      const token = await authenticator.generate(user)
      logEvent(request, LOG_TYPE_SIGN_IN, user.uid, {
        method: SIGN_IN_METHOD_GOOGLE,
        role: user.role,
        email: user.email,
      })
      console.log({ member_id })
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
    const { token, device_token, role, code } = request.all()
    const options = { audience: Config.get('services.apple.client_id') }
    let email
    try {
      const socialData = await appleSignIn.verifyIdToken(token, options)
      email = socialData.email
    } catch (e) {
      throw new HttpException('Invalid token', 400)
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
            throw new HttpException('User already exists, can be switched', 400)
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
      logEvent(request, LOG_TYPE_SIGN_IN, user.uid, {
        method: SIGN_IN_METHOD_APPLE,
        role: user.role,
        email: user.email,
      })
      return response.res(token)
    }

    throw new HttpException('Invalid role', 400)
  }
}

module.exports = OAuthController
