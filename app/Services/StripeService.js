'use strict'

const Stripe = require('../Classes/Stripe')
const HttpException = require('../Exceptions/HttpException')
const PricePlanService = use('App/Services/PricePlanService')
const {
  exceptions: { NO_PRODUCTS_EXIST, SUBSCRIPTION_FAILED },
} = require('../exceptions')
class StripeService {
  static async getProducts() {
    const products = await Stripe.getProducts()
    const prices = await Stripe.getPrices()
    return (products?.data || []).map((product) => ({
      ...product,
      prices: (prices?.data || []).filter((price) => product.id === price.product),
    }))
  }

  static async createSubscription({ user_id, product_id, quantity = 1 }) {
    try {
      const pricePlans = await PricePlanService.getPlanByProductId(product_id)

      if (!pricePlans?.length) {
        throw new HttpException(NO_PRODUCTS_EXIST, 400)
      }

      const mode = pricePlans.find((price) => !price.one_time_pay) ? 'subscription' : 'payment'
      const prices = pricePlans.map((price) => price.price_id)
      const checkoutSession = await Stripe.createCheckoutSessions({
        user_id,
        mode,
        quantity,
        prices,
      })
      return {
        success_url: checkoutSession.success_url,
        cancel_url: checkoutSession.cancel_url,
        url: checkoutSession.url,
      }
    } catch (e) {
      console.log('create subscription failed', e.message)
      throw new HttpException(SUBSCRIPTION_FAILED, 400)
    }
  }
}

module.exports = StripeService
