'use strict'

const StripeService = use('App/Services/StripeService')
class StripeController {
  async getProducts({ request, response }) {
    response.res(await StripeService.getProducts())
  }
  async createSubscription({ request, auth, response }) {
    const { subscriptions } = request.all()
    response.res(await StripeService.createSubscription({ user_id: auth.user.id, subscriptions }))
  }
}

module.exports = StripeController
