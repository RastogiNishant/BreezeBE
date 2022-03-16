'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const EstateViewInvite = use('App/Models/EstateViewInvite')
const HttpException = use('App/Exceptions/HttpException')
const {ERROR_VIEW_INVITE_NOT_EXISTING} = require('../constants')

class ViewEstateInvitationCodeExist {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request }, next) {
    // call next to advance the request
    const code = request.params.code
    const inviteCode = await EstateViewInvite.findBy('code', code)
    if(!inviteCode) {
      throw new HttpException('This code does not exist', 412, ERROR_VIEW_INVITE_NOT_EXISTING)
    }
    request.estate_id = inviteCode.estate_id
    request.estate_view_invite_id = inviteCode.id
    await next()
  }
}

module.exports = ViewEstateInvitationCodeExist
