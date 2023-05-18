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
} = require('../constants')
const PricePlanService = use('App/Services/PricePlanService')
const PaymentAccountService = use('App/Services/PaymentAccountService')
const UserService = use('App/Services/UserService')
const ContractService = require('./ContractService')
const OrderService = require('./OrderService')
const Database = use('Database')
const Logger = use('Logger')
const Ws = use('Ws')
const moment = require('moment')

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

  static async createSubscription({ user_id, product_id }) {
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

      const mode = pricePlans.find((price) => price.mode === PAY_MODE_UPFRONT)
        ? 'payment'
        : 'subscription'
      const prices = pricePlans.map((price) => {
        if (price.mode !== PAY_MODE_USAGE) return { price: price.price_id, quantity: 1 }
        return { price: price.price_id }
      })
      const checkoutSession = await Stripe.createCheckoutSession({
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
    //const data = stripeData?.data?.object

    let data = stripeData?.data?.object
    data.client_reference_id = 13
    Logger.info(`stripe webhook payload ${JSON.stringify(data)}`)
    switch (event) {
      case Stripe.STRIPE_EVENTS.CUSTOMER_CREATED:
        break
      case Stripe.STRIPE_EVENTS.PAYMENT_SUCCEEDED:
        break
      case Stripe.STRIPE_EVENTS.SUBSCRIPTION_CREATED:
        break
      case Stripe.STRIPE_EVENTS.CHECKOUT_SESSION_COMPLETED:
        await this.checkoutSessionCompleted(data)
        break
      case Stripe.STRIPE_EVENTS.CHECKOUT_ASYNC_PAYMENT_SUCCEEDED:
        await this.fillContract(data)
        break
      case Stripe.CHECKOUT_SESSION_FAILED:
        await this.failedCheckoutSession(data)
        break
      case Stripe.STRIPE_EVENTS.CHARGE_REFUNDED:
        await this.refundOrder(data)
        break
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
            date: moment(data.created).format(DATE_FORMAT),
          },
          trx
        )
      }

      //TODO: Need to save payment information though it's draft, because it will be paid asynchronously , need to compare with payment_intent later
      if (data.payment_status === Stripe.STRIPE_STATUS.PAID) {
        await this.createContract({ data, status: STATUS_ACTIVE }, trx)
      } else {
        await this.createContract({ data, status: STATUS_DRAFT }, trx)
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

  static async createContract({ data, status }, trx) {
    //TODO: need to save product info to env
    await ContractService.createContract(
      {
        user_id: data.client_reference_id,
        contract_id: data.id,
        payment_method: PAYMENT_METHOD_STRIPE,
        date: moment(data.created).format(DATE_FORMAT),
        livemode: data.livemode,
        status,
      },
      trx
    )

    await OrderService.createOrder(
      {
        user_id: data.client_reference_id,
        contract_id: data.id,
        date: moment(data.created).format(DATE_FORMAT),
        livemode: data.livemode,
        status: status === STATUS_ACTIVE ? PAID_PARTIALY_STATUS : PAID_PENDING_STATUS,
      },
      trx
    )
  }

  static async fillContract(data) {
    const trx = await Database.beginTransaction()
    try {
      if (data.client_reference_id && data.customer) {
        await PaymentAccountService.saveCustomer(
          {
            user_id: data.client_reference_id,
            account_id: data.customer,
            livemode: data.livemode,
          },
          trx
        )
      }

      await ContractService.updateContract(
        {
          user_id: data.client_reference_id,
          contract_id: data.id,
          status: STATUS_ACTIVE,
        },
        trx
      )
      await OrderService.updateOrder({ contract_id: data.id, status: PAID_PARTIALY_STATUS }, trx)

      await trx.commit()
    } catch (e) {
      Logger.error(
        `${data.client_reference_id} checkout.session.async_payment_succeeded failed ${e.message}`
      )
      await trx.rollback()
    }
  }

  static async refundOrder(data) {
    const paymentAccount = await PaymentAccountService.getByAccountId(data.customer)
    if (!paymentAccount) {
      return
    }

    const user_id = paymentAccount.user_id
    const contract = await ContractService.getContractByUser(user_id)
    const trx = await Database.beginTransaction()
    try {
      //TODO: need to consider if all refunded
      await ContractService.updateContract(
        {
          user_id: data.client_reference_id,
          contract_id: contract.contract_id,
          livemode: data.livemode,
          status: STATUS_DELETE,
        },
        trx
      )
      await OrderService.updateOrder({ contract_id: data.id, status: PAID_PENDING_STATUS }, trx)

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
      await ContractService.updateContract(
        {
          user_id: data.client_reference_id,
          contract_id: data.id,
          livemode: data.livemode,
          status: STATUS_DELETE,
        },
        trx
      )
      await OrderService.updateOrder({ contract_id: data.id, status: PAID_FAILED }, trx)
      await PaymentAccountService.deleteCustomer(
        { user_id: data.client_reference_id, contract_id: data.id },
        trx
      )
      await trx.commit()

      this.emitEvent({
        user_id: data.client_reference_id,
        event: WEBSOCKET_EVENT_CHECKOUT_SESSION_FAILED,
        data,
      })
    } catch (e) {
      Logger.error(
        `${data.client_reference_id} checkout.session.async_payment_succeeded failed ${e.message}`
      )
      await trx.rollback()
    }
  }

  static async emitEvent({ user_id, event, data }) {
    const channel = `landlord:*`
    const topicName = `landlord:${user_id}`
    const topic = Ws.getChannel(channel).topic(topicName)

    if (topic) {
      topic.broadcast(event, data)
    }
  }
}

module.exports = StripeService
