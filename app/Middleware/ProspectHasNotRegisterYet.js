'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use('App/Models/User')
const {USER_ROLE} = require('../constants')

class ProspectHasNotRegisterYet {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request }, next) {
    // call next to advance the request
    const prospectExists = User.query()
      .where('email', request.body.email)
      .where('role', USER_ROLE)
      .first()
    if(prospectExists) {
      throw new HttpException('Prospect has already registered.', 412, ERROR_PROSPECT_HAS_ALREADY_REGISTERED)
    }
    await next()
  }
}

module.exports = ProspectHasNotRegisterYet
