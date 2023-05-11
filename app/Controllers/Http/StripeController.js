'use strict'

const StripeService = use('App/Services/StripeService')
class StripeController {
  async getProducts({ request, response }) {
    response.res(await StripeService.getProducts())
  }
}

module.exports = StripeController
