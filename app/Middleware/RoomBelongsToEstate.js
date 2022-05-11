'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const Room = use('App/Models/Room')
const HttpException = use('App/Exceptions/HttpException')

class RoomBelongsToEstate {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request }, next) {
    // call next to advance the request
    const { estate_id, room_id } = request.all()
    const room = await Room.query().where('estate_id', estate_id).where('id', room_id).first()
    if (!room) {
      throw new HttpException('This room does not belong to this Property')
    }
    await next()
  }
}

module.exports = RoomBelongsToEstate
