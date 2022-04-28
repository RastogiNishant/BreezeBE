'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const User = use('App/Models/User')
const HttpException = use('App/Exceptions/AppException')

class UserWithEmailExist {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request }, next) {
    const { email } = request.all()
    try {
      const user = await User.findByOrFail({ email })
      await next()
    } catch (error) {
      throw new HttpException(error, 400)
    }
  }
}

module.exports = UserWithEmailExist
