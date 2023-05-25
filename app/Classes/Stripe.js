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

  static async updateCustomer(customer, params) {
    await stripe.customers.update(customer, params)
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
      payment_method_collection: 'always',
      mode,
    })
  }

  static async getCheckoutSession(id) {
    return await stripe.checkout.sessions.retrieve(id)
  }

  static async getPaymentIntent(id) {
    return await stripe.paymentIntents.retrieve(id)
  }

  static async setPaymentMethodToCustomer(customer, paymentIntent) {
    const paymentMethod = await this.getPaymentMethod(paymentIntent)
    if (paymentMethod) {
      await this.updateCustomer(customer, {
        invoice_settings: { custom_fields: '', default_payment_method: paymentMethod },
      })
    }
  }

  static async getPaymentMethod(id) {
    const paymentIntent = await this.getPaymentIntent(id)
    return paymentIntent?.payment_method
  }
}

module.exports = Stripe
