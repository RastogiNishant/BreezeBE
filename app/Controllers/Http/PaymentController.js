'use strict'

const Payment = use('App/Models/Payment')
const PaymentService = use('App/Services/PaymentService')
const HttpException = use('App/Exceptions/HttpException')
const AppException = use('App/Exceptions/AppException')

/** @type {typeof import('/providers/Static')} */

class PaymentController {
  /**
   *
   */
  async createTransaction(paymentData) {
    try {
      const { payment } = await PaymentService.createPayment({
        ...paymentData,
      })
      return payment
    } catch (e) {
      throw e
    }
  }
  /**
   *
   */
  async processPayment({ request, auth, response }) {
    try {
      const { ...paymentData } = request.all()
      const payment = await PaymentService.processStripePayment({
          ...paymentData,
      })
      const transaction = await this.createTransaction({
        transaction_id: payment.id,
        payment_method: 'STRIPE',
        amount: payment.amount,
        user_id: auth.current.user.id,
        lettings: '2',
        payment_method_response: payment
      })

      return response.res(payment)
    } catch (e) {
      throw e
    }
  }
  /**
   *
   */
  async processPaypal({ request, auth, response }) {
    try {
      const { ...paymentData } = request.all()
      const transaction = await this.createTransaction({
        transaction_id: paymentData.value.details.purchase_units[0].payments.captures[0].id,
        payment_method: 'PAYPAL',
        amount: parseInt(paymentData.value.details.purchase_units[0].amount.value) * 100,
        user_id: auth.current.user.id,
        lettings: '2',
        payment_method_response:{}
      })
      return response.res(transaction)
    } catch (e) {
      throw e
    }
  }
  /**
   *
   */
  async getUserPayments({ request, auth, response }) {
    try {
      const { ...paymentData } = request.all()
      const payments = await PaymentService.getUserPayments(auth.current.user.id)
      return response.res(payments)
    } catch (e) {
      throw e
    }
  }

}

module.exports = PaymentController
