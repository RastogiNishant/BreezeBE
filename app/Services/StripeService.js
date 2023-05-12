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

  static async createSubscription({ user_id, subscriptions }) {
    try {
      const product_ids = subscriptions.map((subscription) => subscription.product_id)
      const pricePlans = await PricePlanService.getPlanByProductId(product_ids)

      if (!pricePlans?.length) {
        throw new HttpException(NO_PRODUCTS_EXIST, 400)
      }

      const mode = pricePlans.find((price) => !price.one_time_pay) ? 'subscription' : 'payment'
      const prices = pricePlans.map((price) => {
        const quantity =
          subscriptions.filter((subscription) => subscription.product_id === price.product_id)?.[0]
            ?.quantity || 1
        if (price?.one_time_pay) return { price: price.price_id, quantity }
        return { price: price.price_id }
      })
      console.log('create Subscription=', prices)
      const checkoutSession = await Stripe.createCheckoutSessions({
        user_id,
        mode,
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
