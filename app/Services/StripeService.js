'use strict'

const Stripe = require('../Classes/Stripe')

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
    const prices = []
    const mode = 'payment'
    await Stripe.createCheckoutSessions({ user_id, mode, quantity, prices })
  }
}

module.exports = StripeService
