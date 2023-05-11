const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

class Stripe {
  static async getProducts() {
    return await stripe.products.list({ limit: 30, active: true })
  }
}

module.exports = Stripe
