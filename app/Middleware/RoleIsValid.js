'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER, ROLE_HOUSEKEEPER] = require('../constants')

class RoleIsValid {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request }, next) {
    // call next to advance the request
    let roles = [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER, ROLE_HOUSEKEEPER]
    const role = request.role
    if (!roles.includes(role)) {
      throw new HttpException('Invalid user role', 401)
    }
    await next()
  }
}

module.exports = RoleIsValid
