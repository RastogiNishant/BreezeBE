'use strict'
const Admin = use('App/Models/Admin')
const { getAuthByRole } = require('../../Libs/utils')

class AuthController {
  async login({ request, response }) {
    let { email, password } = request.all()

    const admin = await Admin.query().where('email', email).first()
    if (!admin) {
      throw new HttpException('You are not registered.', 404)
    }

    let authenticator
    try {
      authenticator = getAuthByRole(auth, 'admin')
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
    Event.fire('mautic:syncContact', user.id, { last_signin_date: new Date() })
    return response.res(token)
  }
}

module.exports = AuthController
