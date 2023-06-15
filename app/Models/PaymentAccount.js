'use strict'

const Model = require('./BaseModel')
class PaymentAccount extends Model {
  static get columns() {
    return ['id', 'user_id', 'payment_method', 'account_id', 'livemode', 'date', 'status']
  }
}

module.exports = PaymentAccount
