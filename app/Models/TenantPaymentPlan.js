'use strict'

const Model = require('./BaseModel')

class TenantPaymentPlan extends Model {
  static get columns() {
    return [
      'id',
      'name',
      'plan_id',
      'price',
      'plan_option',
      'description',
      'subscription_sku',
    ]
  }
}

module.exports = TenantPaymentPlan