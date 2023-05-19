'use strict'

const Model = require('./BaseModel')

class Bill extends Model {
  // 1 landlord can have at most 2 orders
  // active: current plan
  //expired: previous plan, but not completely paid yet, if paid completely at the end of the month, it will be changed to deleted
  static get columns() {
    return [
      'id',
      'order_id',
      'bill_id',
      'price_id',
      'amount',
      'paid_amount',
      'unit_amount',
      'status',
    ]
  }
}

module.exports = Bill
