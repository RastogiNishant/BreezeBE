'use strict'

const Model = require('./BaseModel')

class Contract extends Model {
  // 1 landlord can have at most 2 orders
  // active: current plan
  //expired: previous plan, but not completely paid yet, if paid completely at the end of the month, it will be changed to deleted
  static get columns() {
    return [
      'id',
      'user_id',
      'contract_id',
      'customer_id', // only for stripe
      'payment_method',
      'date',
      'status',
      'livemode',
    ]
  }
}

module.exports = Contract
