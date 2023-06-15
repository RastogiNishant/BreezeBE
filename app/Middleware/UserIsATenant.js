'use strict'

const { matches } = require('lodash')
const { STATUS_ACTIVE, ROLE_USER } = require('../constants')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const CurrentTenant = use('App/Models/User')
const HttpException = use('App/Exceptions/HttpException')

class UserIsATenant {
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
  async wsHandle({ socket, auth, request }, next) {
    // call next to advance the request
    let matches
    if ((matches = socket.topic.match(/^tenant:([0-9]+)$/))) {
      if (auth.user.id !== parseInt(matches[1])) {
        throw new HttpException('User can only connect to tenant topic containing his id.')
      }
      if (auth.user.role !== ROLE_USER) {
        throw new HttpException('Topic is only available to prospects.')
      }
    } else {
      throw new HttpException('Topic not valid.')
    }
    await next()
  }
}

module.exports = UserIsATenant
