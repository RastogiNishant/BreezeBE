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

  static async handle(stripeData) {
    if (!stripeData?.data?.object) {
      throw new HttpException(Stripe.STRIPE_EXCEPTIONS.NOT_VALID_PARAM, 400)
    }

    const event = stripeData.type
    const data = stripeData?.data?.object
    switch (event) {
      case Stripe.STRIPE_EVENTS.CUSTOMER_CREATED:
        break
      case Stripe.STRIPE_EVENTS.PAYMENT_SUCCEEDED:
        break
      case Stripe.STRIPE_EVENTS.SUBSCRIPTION_CREATED:
        break
      case Stripe.STRIPE_EVENTS.CHECKOUT_SESSION_COMPLETED:
        await this.CheckoutSessionCompleted({
          data,
          livemode: stripeData.livemode,
        })
        break
      case Stripe.STRIPE_EVENTS.CHECKOUT_ASYNC_PAYMENT_SUCCEEDED:
        await this.createPayment({ data, livemode: stripeData.livemode })
        break
      //TODO: Implement refund to suspend using connect & match
      default:
        break
    }
  }

  static async CheckoutSessionCompleted({ data, livemode }) {
    //data.client_reference_id
    if (data.complete !== Stripe.STRIPE_STATUS.COMPLETE) {
      return
    }

    // if (data.client_reference_id && data.customer) {
    //   await PaymentAccountService.saveCustomer({
    //     user_id: data.client_reference_id,
    //     account_id: data.customer,
    //   })
    // }

    //TODO: Need to save payment information though it's draft, because it will be paid asynchronously , need to compare with payment_intent later

    if (data.payment_status === Stripe.STRIPE_STATUS.PAID) {
      this.createPayment({ data, livemode })
    }
  }

  static async createPayment({ data, livemode = false }) {
    //TODO: need to save product info to env
  }

  static async createSubscription(data) {
    //console.log('createSubscription=', data)
  }
}

module.exports = StripeService
