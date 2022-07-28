'use strict'

const { matches } = require('lodash')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const CurrentTenant = use('App/Models/EstateCurrentTenant')
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
      let tenantEstates = await CurrentTenant.query()
        .leftJoin('estates', 'estate_current_tenant.estates_id', 'estates.id')
        .where('user_id', auth.user.id)
        .where('estate_current_tenant.status', 'active')
        .fetch()
      if (!tenantEstates) {
        throw new HttpException('Topic is only available to current tenants.')
      }
    } else {
      throw new HttpException('Topic not valid.')
    }
    await next()
  }
}

module.exports = UserIsATenant
