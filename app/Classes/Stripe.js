const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

class Stripe {
  static async getProducts() {
    // return await stripe.products.list({ limit: 30, active: true, expand: ['data.default_price'] })
    return await stripe.products.list({ limit: 30, active: true })
  }

  static async getPrices() {
    return await stripe.prices.list({
      limit: 30,
      active: true,
    })
  }

  static async createCheckoutSessions({ user_id, mode = 'payment', quantity = 1, prices }) {
    const line_items = prices.map((price) => ({ price, quantity }))
    const session = await stripe.checkout.sessions.create({
      success_url: `${process.env.SITE_URL}/success`,
      cancel_url: `${process.env.SITE_URL}/cancel`,
      line_items,
      client_reference_id: user_id,
      mode,
    })
  }
}

module.exports = Stripe
