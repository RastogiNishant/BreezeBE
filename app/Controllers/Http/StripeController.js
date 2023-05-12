'use strict'

const StripeService = use('App/Services/StripeService')
class StripeController {
  async getProducts({ request, response }) {
    response.res(await StripeService.getProducts())
  }
  async createSubscription({ request, auth, response }) {
    const { product_id, quantity } = request.all()
    response.res(
      await StripeService.createSubscription({ user_id: auth.user.id, product_id, quantity })
    )
  }
}

module.exports = StripeController
