'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const User = use('App/Models/User')
const HttpException = use('App/Exceptions/HttpException')
const { getAuthByRole } = require('../Libs/utils')
const {ERROR_CHANGE_EMAIL_PASSWORD_NOT_MATCH} = require('../constants')

class UserCanValidlyChangeEmail {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, auth, response}, next) {
    //let this pass if email is not set
    if(!request.body.email) {
      await next()
    }
    //lets find a user having this role and email
    let user = await User.query().where('email', request.body.email).where('role', auth.user.role).first()
    if(user) {
      throw new HttpException('This email already exists in our users. Please use another one.')
    }
    //validate password
    const authenticator = getAuthByRole(auth, auth.user.role)
    const uid = await User.getHash(auth.user.email, auth.user.role)
    try {
      await authenticator.attempt(uid, request.body.password)
    } catch (e) {
      throw new HttpException(e, 412, ERROR_CHANGE_EMAIL_PASSWORD_NOT_MATCH)
    }
    
    await next()
  }
}

module.exports = UserCanValidlyChangeEmail
