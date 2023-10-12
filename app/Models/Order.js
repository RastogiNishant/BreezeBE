'use strict'

const Model = require('./BaseModel')

class Order extends Model {
  // 1 landlord can have at most 2 orders
  // active: current plan
  //expired: previous plan, but not completely paid yet, if paid completely at the end of the month, it will be changed to deleted
  static get columns() {
    return [
      'id',
      'subscription_id',
      'invoice_id',
      'date',
      'start_at',
      'end_at',
      'status',
      'livemode'
    ]
  }
}

module.exports = Order
