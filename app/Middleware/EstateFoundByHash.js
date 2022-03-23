'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Estate = use('App/Models/Estate')
const HttpException = use('App/Exceptions/HttpException')
const ERROR_ESTATE_NOT_FOUND_BY_HASH = 12066

class EstateFoundByHash {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request }, next) {
    // call next to advance the request
    const hash = request.params.hash
    const estate = await Estate.query().where('hash', hash).first()
    if(!estate) {
      throw new HttpException('Estate not found by hash.', 412, ERROR_ESTATE_NOT_FOUND_BY_HASH)
    }
    request.estate = estate
    await next()
  }
}

module.exports = EstateFoundByHash
