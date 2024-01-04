'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const EstateSyncContactRequest = use('App/Models/EstateSyncContactRequest')
const HttpException = use('App/Exceptions/HttpException')
const { ERROR_LANDLORD_DOES_NOT_OWN_THIS_ESTATE } = require('../constants')

class LandlordOwnsThisContactRequest {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async wsHandle({ socket, request, auth }, next) {
    // call next to advance the request
    const landlordId = auth.user.id
    let matches = null
    if ((matches = socket.topic.match(/^contactrequest:([0-9]+)$/))) {
      const result = await EstateSyncContactRequest.query()
        .innerJoin('estates', 'estates.id', 'estate_sync_contact_requests.estate_id')
        .where('estates.user_id', landlordId)
        .where('estate_sync_contact_requests.id', matches[1])
        .first()
      if (!result) {
        throw new HttpException(
          'Landlord does not own this contact request.',
          412,
          ERROR_LANDLORD_DOES_NOT_OWN_THIS_ESTATE
        )
      }
      request.contactRequestId = matches[1]
      return await next()
    }
  }
}

module.exports = LandlordOwnsThisContactRequest
