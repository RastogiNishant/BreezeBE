// 'use strict'
const PaymentMethod = use('App/Models/PaymentMethod')

class PaymentMethodService {
  /**
   * Create payment flow
   */
  static async create(paymentData) {
    const payment = await PaymentMethod.createItem(paymentData)
    return { payment }
  }
  /**
   *s
   */
  static async update(paymentMethodId, userId, data) {

    const paymentMethod = await PaymentMethod.query()
      .where({ user_id: userId,  id: paymentMethodId})
      .first()
    if (!paymentMethod) {
      throw new AppException('PaymentMethod does not exists')
    }
    await PaymentMethod
      .query()
      .where('user_id', userId)
      .update({ is_primary: false })

    await paymentMethod.updateItem({'is_primary': true})

    return paymentMethod
  }
  /**
   *
   */
  static async get(userId) {
    return await PaymentMethod.query()
      .where('user_id', userId)
      .orderBy('updated_at', 'desc')
      .fetch()
  }
}

module.exports = PaymentMethodService
