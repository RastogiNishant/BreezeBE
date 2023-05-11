'use strict'

const Stripe = require('../Classes/Stripe')

class StripeService {
  static async getProducts() {
    return await Stripe.getProducts()
  }
}

module.exports = StripeService
