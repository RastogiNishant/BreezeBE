'use strict'
const Admin = use('App/Models/Admin')
const { getAuthByRole } = require('../../../Libs/utils')
const HttpException = use('App/Exceptions/HttpException')

class AuthController {
  async login({ request, auth, response }) {
    let { email, password } = request.all()

    const admin = await Admin.query().where('email', email).first()
    if (!admin) {
      throw new HttpException('You are not registered.', 404)
    }

    const authenticator = auth.authenticator('jwtAdministrator')
    const uid = Admin.getHash(email)
    let token
    try {
      token = await authenticator.attempt(uid, password)
    } catch (e) {
      let [error, message] = e.message.split(':')
      if (!message) message = error
      throw new HttpException(message, 401)
    }
    return response.res(token)
  }
}

module.exports = AuthController
