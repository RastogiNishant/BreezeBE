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
}

module.exports = StripeService
