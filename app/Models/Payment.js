'use strict'

const Model = require('./BaseModel')

class Payment extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'payment_method',
      'transaction_id',
      'published_at',
      'payment_method_response',
      'amount',
      'lettings'
    ]
  }

  /**
   *
   */
  static get readonly() {
    return [
      'id',
      'user_id',
      'payment_method',
      'transaction_id',
      'published_at',
      'payment_method_response',
      'amount',
      'lettings'
    ]
  }

  static get hidden() {
    return ['payment_method_response']
  }
  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/PaymentSerializer'
  }

}

module.exports = Payment
