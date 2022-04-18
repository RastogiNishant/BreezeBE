'use strict'

const Model = require('./BaseModel')


class PaymentMethod extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'payment_method_type',
      'is_primary'
    ]
  }

  /**
   *
   */
  static get readonly() {
    return [
      'id',
      'user_id',
      'payment_method_type',
    ]
  }
  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/PaymentSerializer'
  }

}

module.exports = PaymentMethod
