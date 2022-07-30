'use strict'

const { ROLE_LANDLORD } = require('../constants')
const HttpException = use('App/Exceptions/HttpException')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class UserIsALandlord {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request }, next) {
    // call next to advance the request
    await next()
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async wsHandle({ socket, request, auth }, next) {
    // call next to advance the request
    let matches
    if ((matches = socket.topic.match(/^landlord:([0-9]+)$/))) {
      if (auth.user.id !== parseInt(matches[1])) {
        throw new HttpException('User can only connect to a landlord topic containing his id.')
      }
      if (auth.user.role !== ROLE_LANDLORD) {
        throw new HttpException('User needs to be a landlord to access this.')
      }
    }
    await next()
  }
}

module.exports = UserIsALandlord
