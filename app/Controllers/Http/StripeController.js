'use strict'

const HttpException = require('../../Exceptions/HttpException')
const Stripe = require('../../Classes/Stripe')
const StripeService = use('App/Services/StripeService')
const Logger = use('Logger')
class StripeController {
  async getProducts({ request, response }) {
    response.res(await StripeService.getProducts())
  }

  async createSubscription({ request, auth, response }) {
    const { product_id } = request.all()
    response.res(await StripeService.createCheckoutSession({ user_id: auth.user.id, product_id }))
  }

  async webhook({ request, response }) {
    try {
      const stripeSignature = request.headers()['stripe-signature']
      const data = await Stripe.verifyWebhook(request.raw(), stripeSignature)
      await StripeService.handle(data)
      response.res(true)
    } catch (e) {
      Logger.error(`stripe webhook error ${e.message}`)
      throw new HttpException(e.message, 400)
    }
  }
  async webhookTest({ request, response }) {
    try {
      const Stripe = require('../../Classes/Stripe')
      const lineItems = await Stripe.getBoughtLineItems(
        'cs_test_b1K7SQa3UuXSmYRpKnWBzLlZtclMfD8Y7oi81bRXajRAhUiGmaSKqN82zR'
      )
      response.res(lineItems)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = StripeController
