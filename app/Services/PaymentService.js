'use strict'
const Payment = use('App/Models/Payment')

class PaymentService {
  /**
   * Create payment flow
   */
  static async createPayment(paymentData) {
    const payment = await Payment.createItem(paymentData)
    return { payment }
  }
  /**
   * process payment flow
   */
  //Stripe
  static async processStripePayment(paymentData) {
    const stripe = require('stripe')('sk_test_51KGnHhLHZE8cb7ZfIKz5loWVvonITW21SlB5tFjn4Sy7k6cZrzX9yTGL3XoWHrMmN3WjvfrazSUmJTwQZQfhXNNi00Wj3O5rc5');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount,
      currency: 'eur',
      payment_method_types: ['card'],
      payment_method: paymentData.payment_method,
      // description: 'Letting plan Charge',
      // metadata: {
      //   order_id: '1003',
      // },
    });
    const paymentIntent1 = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      // paymentIntent.payment_method
      {payment_method: 'pm_card_visa'}
    );
    return paymentIntent1

  }
  /**
   *
   */
  static async getUserPayments(userId) {
    return await Payment.query()
      .where('user_id', userId)
      .orderBy('updated_at', 'desc')
      .fetch()
  }
}

module.exports = PaymentService
