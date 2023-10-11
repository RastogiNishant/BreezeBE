'use strict'

const Model = require('./BaseModel')

class Bill extends Model {
  // 1 landlord can have at most 2 orders
  // active: current plan
  //expired: previous plan, but not completely paid yet, if paid completely at the end of the month, it will be changed to deleted
  static get columns() {
    return [
      'id',
      'invoice_id',
      'bill_id', // subscription_item in invoice.created. it will be used to create an invoice again for usage
      'price_id',
      'status'
    ]
  }
}

module.exports = Bill
