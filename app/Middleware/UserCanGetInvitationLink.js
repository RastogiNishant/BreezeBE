'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const HttpException = use('App/Exceptions/HttpException')
const DataStorage = use('DataStorage')
const {
  INVITATION_LINK_RETRIEVAL_TRIES_KEY,
  INVITATION_LINK_RETRIEVAL_MAX_TRIES_LIMIT,
} = require('../constants')

class UserCanGetInvitationLink {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request }, next) {
    const ip = request.ip()
    const tries = await DataStorage.getItem(ip, INVITATION_LINK_RETRIEVAL_TRIES_KEY)
    if (tries && tries >= INVITATION_LINK_RETRIEVAL_MAX_TRIES_LIMIT) {
      throw new HttpException(`Maximum failed tries reached.`, 422)
    }
    await next()
  }
}

module.exports = UserCanGetInvitationLink
