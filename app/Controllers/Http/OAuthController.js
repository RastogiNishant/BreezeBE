'use strict'

const { get } = require('lodash')

const HttpException = use('App/Exceptions/HttpException')
const User = use('App/Models/User')
const Config = use('Config')
const GoogleAuth = use('GoogleAuth')
const UserService = use('App/Services/UserService')

const { getAuthByRole } = require('../../Libs/utils')

const { ROLE_LANDLORD, ROLE_USER, STATUS_DELETE, STATUS_NEED_VERIFY } = require('../../constants')

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
  async googleAuthConfirm({ ally, auth, response }) {
    let authUser
    try {
      authUser = await ally.driver('google').getUser()
    } catch (e) {
      throw new HttpException('Invalid user', 400)
    }

    const { id, email } = authUser.toJSON()
    let user = await User.query()
      .where('email', email)
      .where('role', ROLE_LANDLORD)
      .whereNot('status', STATUS_DELETE)
      .first()

    // Create user if not exists
    if (!user) {
      user = await UserService.createUserFromOAuth({
        ...authUser.toJSON(),
        role: ROLE_LANDLORD,
        google_id: id,
      })
    }

    // Auth user
    if (user && user.google_id === id) {
      const authenticator = getAuthByRole(auth, user.role)
      const token = await authenticator.generate(user)

      return response.res(token)
    }

    throw new new HttpException('Invalid user', 400)()
  }

  /**
   * Login by OAuth token
   */
  async tokenAuth({ request, auth, response }) {
    const { token, device_token, role } = request.all()
    let ticket
    try {
      ticket = await GoogleAuth.verifyIdToken({
        idToken: token,
        audience: Config.get('services.ally.google.client_id'),
      })
    } catch (e) {
      throw new HttpException('Invalid token', 400)
    }

    const googleId = get(ticket, 'payload.sub')
    if (!googleId) {
      throw new HttpException('Invalid auth data response', 400)
    }

    const query = User.query()
      .where('google_id', googleId)
      .whereNot('status', STATUS_DELETE)
      .orderBy('updated_at', 'desc')
    if ([ROLE_LANDLORD, ROLE_USER].includes(role)) {
      query.where('role', role)
    }
    let user = await query.first()

    if (!user && !role) {
      throw new HttpException('User not exists', 412)
    }

    if (!user && [ROLE_LANDLORD, ROLE_USER].includes(role)) {
      user = await UserService.createUserFromOAuth({
        ...ticket.getPayload(),
        google_id: googleId,
        device_token,
        role,
      })
    }

    if (user) {
      const authenticator = getAuthByRole(auth, user.role)
      const token = await authenticator.generate(user)
      return response.res(token)
    }

    throw new HttpException('Invalid role', 400)
  }
}

module.exports = OAuthController
