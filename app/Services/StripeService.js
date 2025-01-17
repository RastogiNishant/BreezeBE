'use strict'

const Stripe = require('../Classes/Stripe')
const HttpException = require('../Exceptions/HttpException')
const {
  ROLE_LANDLORD,
  WEBSOCKET_EVENT_CHECKOUT_SESSION_FAILED,
  STATUS_ACTIVE,
  STATUS_DRAFT,
  PAYMENT_METHOD_STRIPE,
  DATE_FORMAT,
  STATUS_DELETE,
  PAID_PARTIALY_STATUS,
  PAID_PENDING_STATUS,
  PAID_FAILED,
  PAY_MODE_UPFRONT,
  PAY_MODE_ONE_TIME,
  PAY_MODE_RECURRING,
  PAY_MODE_USAGE,
  DAY_FORMAT,
  PAID_COMPLETE_STATUS,
  PRICE_MATCH
} = require('../constants')
const PricePlanService = use('App/Services/PricePlanService')
const PaymentAccountService = use('App/Services/PaymentAccountService')
const UserService = use('App/Services/UserService')
const SubscriptionService = require('./SubscriptionService')
const OrderService = require('./OrderService')
const Database = use('Database')
const Logger = use('Logger')
const WebSocket = use('App/Classes/Websocket')
const moment = require('moment')

const {
  exceptions: {
    NO_PRODUCTS_EXIST,
    SUBSCRIPTION_FAILED,
    ERROR_SUBSCRIPTION_NOT_CREATED,
    ERROR_PRICE_PLAN_CONFIGURATION
  },
  exceptionCodes: { ERROR_SUBSCRIPTION_NOT_CREATED_CODE, ERROR_PRICE_PLAN_CONFIGURATION_CODE }
} = require('../exceptions')

class StripeService {
  static async getProducts() {
    const products = await Stripe.getProducts()
    const prices = await Stripe.getPrices()
    return (products?.data || []).map((product) => ({
      ...product,
      prices: (prices?.data || []).filter((price) => product.id === price.product)
    }))
  }

  static async createCheckoutSession({ user_id, product_id }) {
    try {
      const user = await UserService.getById(user_id, ROLE_LANDLORD)
      if (!user) {
        return null
      }

      let pricePlans = await PricePlanService.getPlanByProductId(product_id)

      if (!pricePlans?.length) {
        throw new HttpException(NO_PRODUCTS_EXIST, 400)
      }

      pricePlans = pricePlans.filter((price) => price.mode !== PAY_MODE_ONE_TIME)

      const mode = pricePlans.find((price) =>
        [PAY_MODE_RECURRING, PAY_MODE_USAGE].includes(price.mode)
      )
        ? 'subscription'
        : 'payment'

      const prices = pricePlans.map((price) => {
        if (price.mode !== PAY_MODE_USAGE) return { price: price.price_id, quantity: 1 }
        return { price: price.price_id }
      })

      const checkoutSession = await Stripe.createCheckoutSession({
        user_id,
        mode,
        prices
      })
      return {
        success_url: checkoutSession.success_url,
        cancel_url: checkoutSession.cancel_url,
        url: checkoutSession.url
      }
    } catch (e) {
      Logger.error('create subscription failed', e.message)
      throw new HttpException(SUBSCRIPTION_FAILED, 400)
    }
  }

  static async handle(stripeData) {
    Logger.info(`stripe webhook payload ${JSON.stringify(stripeData)}`)
    if (!stripeData?.data?.object) {
      throw new HttpException(Stripe.STRIPE_EXCEPTIONS.NOT_VALID_PARAM, 400)
    }

    const event = stripeData.type
    //const data = stripeData?.data?.object

    let data = stripeData?.data?.object
    data.client_reference_id = 13
    switch (event) {
      case Stripe.STRIPE_EVENTS.CUSTOMER_CREATED:
        break
      case Stripe.STRIPE_EVENTS.PAYMENT_SUCCEEDED:
        break
      case Stripe.STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        break
      case Stripe.STRIPE_EVENTS.SUBSCRIPTION_CREATED:
        break
      case Stripe.STRIPE_EVENTS.INVOICE_CREATED:
        await this.invoiceCreated(data)
        break
      case Stripe.STRIPE_EVENTS.INVOICE_PAID:
        await this.invoicePaid(data)
        break
      case Stripe.STRIPE_EVENTS.CHECKOUT_SESSION_COMPLETED:
        await this.checkoutSessionCompleted(data)
        break
      case Stripe.STRIPE_EVENTS.CHECKOUT_ASYNC_PAYMENT_SUCCEEDED:
        await this.fillSubscription(data)
        break
      case Stripe.CHECKOUT_SESSION_FAILED:
        await this.failedCheckoutSession(data)
        break
      // case Stripe.STRIPE_EVENTS.CHARGE_REFUNDED:
      //   await this.refundOrder(data)
      //   break
      default:
        break
    }
  }

  static async checkoutSessionCompleted(data) {
    //data.client_reference_id

    if (data.status !== Stripe.STRIPE_STATUS.COMPLETE) {
      return
    }

    const trx = await Database.beginTransaction()
    try {
      if (data.client_reference_id && data.customer) {
        await PaymentAccountService.saveCustomer(
          {
            user_id: data.client_reference_id,
            account_id: data.customer,
            livemode: data.livemode,
            date: moment(data.created).format(DATE_FORMAT)
          },
          trx
        )
      }
      //TODO: Need to save payment information though it's draft, because it will be paid asynchronously , need to compare with payment_intent later
      if (data.payment_status === Stripe.STRIPE_STATUS.PAID) {
        await this.createSubscription({ data, status: STATUS_ACTIVE }, trx)
      } else {
        await this.createSubscription({ data, status: STATUS_DRAFT }, trx)
        /*
        - create order with paid amount
        - probably need to compare paid amount & sum of one time paid amount if a customer paid all amounts
        */
      }
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      Logger.error(`${data.client_reference_id} checkoutSessionCompleted failed ${e.message}`)
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async createSubscription({ data, status }, trx) {
    await SubscriptionService.createSubscription(
      {
        user_id: data.client_reference_id,
        contract_id: data.id,
        subscription_id: data?.subscription,
        payment_method: PAYMENT_METHOD_STRIPE,
        date: moment.utc(data.created * 1000).format(DATE_FORMAT),
        livemode: data.livemode,
        status
      },
      trx
    )

    // await OrderService.createOrder(
    //   {
    //     user_id: data.client_reference_id,
    //     contract_id: data.id,
    //     subscription_id: data?.subscription,
    //     date: moment.utc(data.created * 1000).format(DATE_FORMAT),
    //     start_at: moment.utc(data.created * 1000).format(DAY_FORMAT),
    //     livemode: data.livemode,
    //     status: status === STATUS_ACTIVE ? PAID_PARTIALY_STATUS : PAID_PENDING_STATUS,
    //   },
    //   trx
    // )
  }

  static async fillSubscription(data) {
    const trx = await Database.beginTransaction()
    try {
      if (data.client_reference_id && data.customer) {
        await PaymentAccountService.saveCustomer(
          {
            user_id: data.client_reference_id,
            account_id: data.customer,
            livemode: data.livemode
          },
          trx
        )
      }

      await SubscriptionService.updateSubscriptionByContractId(
        {
          user_id: data.client_reference_id,
          contract_id: data.id,
          subscription_id: data?.subscription,
          status: STATUS_ACTIVE
        },
        trx
      )
      await Stripe.setPaymentMethodToCustomer(data.customer, data.payment_intent)
      // await OrderService.updateOrder(
      //   { subscription_id: data.id, status: PAID_PARTIALY_STATUS },
      //   trx
      // )
      await trx.commit()
    } catch (e) {
      Logger.error(
        `${data.client_reference_id} checkout.session.async_payment_succeeded failed ${e.message}`
      )
      await trx.rollback()
    }
  }

  static async invoiceCreated(data) {
    try {
      await OrderService.addInvoice(data)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  static async invoicePaid(data) {
    try {
      await OrderService.updateOrder({ invoice_id: data.id, status: PAID_COMPLETE_STATUS })
      await Stripe.setPaymentMethodToCustomer(data.customer, data.payment_intent)
    } catch (e) {
      Logger.error(`Invoice paid failed ${e.message}`)
    }
  }

  static async refundOrder(data) {
    const paymentAccount = await PaymentAccountService.getByAccountId(data.customer)
    if (!paymentAccount) {
      return
    }

    const user_id = paymentAccount.user_id
    const subscription = await SubscriptionService.getContractBySubcription(user_id)
    const trx = await Database.beginTransaction()
    try {
      //TODO: need to consider if all refunded
      await SubscriptionService.updateContract(
        {
          user_id: data.client_reference_id,
          subscription_id: subscription.subscription_id,
          livemode: data.livemode,
          status: STATUS_DELETE
        },
        trx
      )

      //TODO: need to update order & bill status

      await trx.commit()
    } catch (e) {
      Logger.error(`${user_id} charge.refunded failed ${e.message}`)
      await trx.rollback()
    }
  }

  //TODO: we need to send email to a landlord if payment is failed
  static async failedCheckoutSession(data) {
    const trx = await Database.beginTransaction()
    try {
      await SubscriptionService.updateSubscription(
        {
          user_id: data.client_reference_id,
          subscription_id: data.subscription,
          livemode: data.livemode,
          status: STATUS_DELETE
        },
        trx
      )

      await PaymentAccountService.deleteCustomer(
        { user_id: data.client_reference_id, contract_id: data.id },
        trx
      )
      await trx.commit()

      this.emitEvent({
        user_id: data.client_reference_id,
        event: WEBSOCKET_EVENT_CHECKOUT_SESSION_FAILED,
        data
      })
    } catch (e) {
      Logger.error(
        `${data.client_reference_id} checkout.session.async_payment_succeeded failed ${e.message}`
      )
      await trx.rollback()
    }
  }

  static async buyPublishEstate({ user_id, plan_id }) {
    if (!plan_id) {
      throw new HttpException(
        ERROR_SUBSCRIPTION_NOT_CREATED,
        400,
        ERROR_SUBSCRIPTION_NOT_CREATED_CODE
      )
    }

    const paymentAccount = await PaymentAccountService.getByUserId({ user_id })
    if (!paymentAccount) {
      throw new HttpException(
        ERROR_SUBSCRIPTION_NOT_CREATED,
        400,
        ERROR_SUBSCRIPTION_NOT_CREATED_CODE
      )
    }
    const publishPlan = await PricePlanService.get({ plan_id, type: PRICE_MATCH })
    if (!publishPlan) {
      throw new HttpException(
        ERROR_PRICE_PLAN_CONFIGURATION,
        400,
        ERROR_PRICE_PLAN_CONFIGURATION_CODE
      )
    }

    try {
      /** TODO: calculate published count for current month */
      const publishedCount = 0
      const customer = paymentAccount.account_id
      /**
       * can't be used for recurring payment. only can be used for one time payment
       */
      // const invoice = await Stripe.createInvoice(customer)
      // await Stripe.createInvoiceItem({
      //   customer,
      //   price: 'price_1NBgpnLHZE8cb7Zfn0icdMe5',
      //   invoice: invoice.id,
      // })
      // console.log('invoice created=', invoice.id)
      // await Stripe.finalizeInvoice(invoice.id)
      // await Stripe.payInvoice(invoice.id)

      /**
       * end of invoice
       *  */
      /** already attached payment intent to customer, so no need to pass payment_method */
      const price = await Stripe.getUnitAmount({
        id: publishPlan.price_id,
        count: publishedCount + 1
      })
      const order = await Stripe.createPaymentIntent({
        customer,
        amount: price
      })

      /** TODO:
       * need to store this payment as pending and send websocket event paid successfully
       * need to update status from webhook
       */
    } catch (e) {
      Logger.error(` ${user_id} paying publishing fee is failed ${e.message}`)
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async emitEvent({ user_id, event, data }) {
    WebSocket.publishToLandlord({
      event,
      userId: user_id,
      data
    })
  }
}

module.exports = StripeService
