'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const { ROLE_LANDLORD } = require('../constants')
const CurrentTenant = use('App/Models/EstateCurrentTenant')
const HttpException = use('App/Exceptions/HttpException')

class UserCanChatHere {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async wsHandle({ socket, auth }, next) {
    // call next to advance the request
    let matches
    let currentTenant
    if ((matches = socket.topic.match(/^estate:([0-9]+)$/))) {
      //estate chat...
      //make sure that the user is the current tenant or the owner of this estate
      let query = CurrentTenant.query()
        .where('estate_id', matches[1])
        .leftJoin('estates', 'estate_current_tenants.estate_id', 'estates.id')
        .orderBy('estate_current_tenants.id', 'desc')
      if (auth.user.role == ROLE_LANDLORD) {
        currentTenant = await query.where('estates.user_id', auth.user.id).first()
      } else {
        currentTenant = await query.where('estate_current_tenants.user_id', auth.user.id).first()
      }
      if (!currentTenant) {
        throw new HttpException(`User cannot send message to this topic.`)
      }
    } else if ((matches = socket.topic.match(/^task:([0-9]+)brz([0-9]+)$/))) {
      //estate task chat
    }
    await next()
  }
}

module.exports = UserCanChatHere
