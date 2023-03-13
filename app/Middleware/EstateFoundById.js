'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Estate = use('App/Models/Estate')
const HttpException = use('App/Exceptions/HttpException')
const ERROR_ESTATE_NOT_FOUND_BY_ID = 12067

class EstateFoundById {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request }, next) {
    // call next to advance the request
    const id = request.params.id
    const estate = await Estate.query().where('id', id).first()
    if (!estate) {
      throw new HttpException('Estate not found.', 412, ERROR_ESTATE_NOT_FOUND_BY_ID)
    }
    request.estate = estate
    await next()
  }
}

module.exports = EstateFoundById
