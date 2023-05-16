'use strict'

const HttpException = require('../../Exceptions/HttpException')
const Stripe = require('../../Classes/Stripe')
const StripeService = use('App/Services/StripeService')
class StripeController {
  async getProducts({ request, response }) {
    response.res(await StripeService.getProducts())
  }

  async createSubscription({ request, auth, response }) {
    const { subscriptions } = request.all()
    response.res(await StripeService.createSubscription({ user_id: auth.user.id, subscriptions }))
  }

  async webhook({ request, response }) {
    try {
      const stripeSignature = request.headers()['stripe-signature']
      const data = await Stripe.verifyWebhook(request.raw(), stripeSignature)
      Logger.info(`Stripe webhook info`, data)
      await StripeService.handle(data)
      response.res(true)
    } catch (e) {
      // Logger.error(`stripe webhook error ${e.message}`)
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = StripeController
