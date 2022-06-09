'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const Estate = use('App/Models/Estate')
const HttpException = use('App/Exceptions/HttpException')
const { ERROR_LANDLORD_DOES_NOT_OWN_THIS_ESTATE } = require('../constants')

class LandlordOwnsThisEstate {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request, auth }, next) {
    // call next to advance the request
    const { estate_id } = request.all()
    const landlordId = auth.user.id
    const result = await Estate.query().where('user_id', landlordId).where('id', estate_id).first()
    if (!result) {
      throw new HttpException(
        'Landlord does not own this estate',
        412,
        ERROR_LANDLORD_DOES_NOT_OWN_THIS_ESTATE
      )
    }
    return await next()
  }
}

module.exports = LandlordOwnsThisEstate
