'use strict'

const Payment = use('App/Models/Payment')
const PaymentService = use('App/Services/PaymentService')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')
const PlanService = use('App/Services/PlanService')
const UserService = use('App/Services/UserService')

/** @type {typeof import('/providers/Static')} */

class PaymentController {
  /**
   *
   */
  async createTransaction(paymentData) {
    const { payment } = await PaymentService.createPayment({
      ...paymentData
    })
    return payment
  }

  /**
   *
   */
  async processPayment({ request, auth, response }) {
    const { ...paymentData } = request.all()
    const payment = await PaymentService.processStripePayment({
      ...paymentData
    })
    const planId = paymentData.plan_id || 4
    const plan = await PlanService.getPlan(planId)
    const planJson = plan ? plan.toJSON() : {}
    const lettings = planJson?.lettings ?? ''
    await this.createTransaction({
      transaction_id: payment.id,
      payment_method: 'STRIPE',
      amount: payment.amount,
      user_id: auth.current.user.id,
      lettings,
      payment_method_response: payment,
      plan_id: planId,
      plan_response: planJson
    })

    UserService.updatePaymentPlan(auth.current.user.id, planId)
    return response.res(payment)
  }

  /**
   *
   */
  async processPaypal({ request, auth, response }) {
    const { ...paymentData } = request.all()
    const planId = paymentData.plan_id
    const plan = await PlanService.getPlan(planId)
    const planJson = plan ? plan.toJSON() : {}
    const lettings = planJson ? planJson.get('lettings') : ''
    const transaction = await this.createTransaction({
      transaction_id: paymentData.value.details.purchase_units[0].payments.captures[0].id,
      payment_method: 'PAYPAL',
      amount: parseInt(paymentData.value.details.purchase_units[0].amount.value) * 100,
      user_id: auth.current.user.id,
      lettings,
      payment_method_response: {},
      plan_id: planId,
      plan_response: planJson
    })
    return response.res(transaction)
  }

  /**
   *
   */
  async getUserPayments({ request, auth, response }) {
    const payments = await PaymentService.getUserPayments(auth.current.user.id)
    return response.res(payments)
  }
}

module.exports = PaymentController
