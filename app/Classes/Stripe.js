const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
class Stripe {
  static STRIPE_EVENTS = {
    SUBSCRIPTION_CREATED: 'customer.subscription.created',
    PAYMENT_SUCCEEDED: 'charge.succeeded',
    CUSTOMER_CREATED: 'customer.created',
    CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
    CHECKOUT_ASYNC_PAYMENT_SUCCEEDED: 'checkout.session.async_payment_succeeded',
    CHECKOUT_SESSION_FAILED: 'checkout.session.async_payment_failed',
    CHARGE_REFUNDED: 'charge.refunded',
    INVOICE_CREATED: 'invoice.created',
    INVOICE_PAID: 'invoice.paid',
    PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  }

  static STRIPE_EXCEPTIONS = {
    NOT_VALID_PARAM: 'Stripe params are not valid',
  }

  static STRIPE_STATUS = {
    SUCCESS: 'succeeded',
    PAID: 'paid',
    COMPLETE: 'complete',
    PENDING: 'pending',
  }

  static async verifyWebhook(data, signature) {
    return await stripe.webhooks.constructEvent(data, signature, process.env.STRIPE_WEBHOOK_SECRET)
  }

  static async getBoughtLineItems(checkoutSessionId) {
    try {
      console.log('line Items getBoughtLineItems=', checkoutSessionId)
      const ret = await stripe.checkout.sessions.listLineItems(checkoutSessionId)
      console.log('line Items url=', ret.url)
      return ret
    } catch (e) {
      console.log('getBoughtLineItems error', e.message)
    }
  }

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

  static async createCheckoutSession({ user_id, mode = 'payment', prices }) {
    return await stripe.checkout.sessions.create({
      success_url: `${process.env.SITE_URL}/success`,
      cancel_url: `${process.env.SITE_URL}/cancel`,
      line_items: prices,
      client_reference_id: user_id,
      mode,
    })
  }

  static async getCheckoutSession(id) {
    return await stripe.checkout.sessions.retrieve(id)
  }
}

module.exports = Stripe
