const { minBy } = require('lodash')
const HttpException = require('../Exceptions/HttpException')
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
      payment_method_types: ['card'],
      success_url: `${process.env.SITE_URL}/success`,
      cancel_url: `${process.env.SITE_URL}/cancel`,
      line_items: prices,
      client_reference_id: user_id,
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto' },
      mode,
    })
  }

  static async getCheckoutSession(id) {
    return await stripe.checkout.sessions.retrieve(id)
  }

  static async createSubscription({ customer, items }) {
    console.log('customer her=', customer)
    console.log('items here=', items)
    return await stripe.subscriptions.create({
      customer,
      items,
      collection_method: 'charge_automatically',
    })
  }

  static async updateSubscription({ id, items }) {
    return await stripe.subscriptions.update(id, {
      items,
    })
  }

  static async getSubsription(id) {
    return await stripe.subscriptions.retrieve(id)
  }

  static async getInvoice(id) {
    return await stripe.invoices.retrieve(id)
  }

  static async getCustomer(customer_id, expand = {}) {
    return await stripe.customers.retrieve(customer_id, expand)
  }

  static async hasDefaultPaymentMethod(customer_id) {
    const customer = await this.getCustomer(customer_id)
    if (!customer.invoice_settings.default_payment_method) {
      return false
    }
    return true
  }

  static async createInvoice(customer) {
    return await stripe.invoices.create({
      customer,
      collection_method: 'charge_automatically',
      pending_invoice_items_behavior: 'exclude',
    })
  }

  static async createInvoiceItem({ customer, price, invoice, quantity = 1 }) {
    const invoiceItem = await stripe.invoiceItems.create({
      customer,
      price,
      invoice,
      quantity,
    })
  }

  static async finalizeInvoice(invoice) {
    await stripe.invoices.finalizeInvoice(invoice)
  }

  static async sendInvoice(invoice) {
    return await stripe.invoices.sendInvoice(invoice)
  }

  static async payInvoice(invoice) {
    return await stripe.invoices.pay(invoice)
  }

  static async createPaymentIntent({ customer, amount }) {
    const customerObject = await this.getCustomer(customer, { expand: ['invoice_settings'] })
    if (!customerObject.invoice_settings?.default_payment_method) {
      throw new HttpException('No set customer payment intent yet', 400)
    }

    return await stripe.paymentIntents.create({
      customer,
      amount,
      setup_future_usage: 'off_session',
      confirmation_method: 'automatic',
      payment_method: customerObject.invoice_settings?.default_payment_method,
      confirm: true,
      currency: 'eur',
      //automatic_payment_methods: { enabled: true },
    })
  }

  static async getPrice(id) {
    return await stripe.prices.retrieve(id, { expand: ['tiers'] })
  }

  static async getUnitAmount({ id, count }) {
    try {
      const price = await this.getPrice(id)
      if (price.tiers) {
        const tierItem = minBy(
          price.tiers.filter((tier) => tier.up_to >= count),
          (tier) => tier.up_to
        )
        return tierItem.unit_amount
      } else {
        return price.unit_amount
      }
    } catch (e) {
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }
}

module.exports = Stripe
