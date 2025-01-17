'use strict'

const Model = require('./BaseModel')

class Plan extends Model {
  static get columns() {
    return [
      'id',
      'name',
      'description',
      'price',
      'role',
      'prospect_free_plan',
      'landlord_free_plan',
      'lettings',
      'discount',
      'status'
    ]
  }

  static get traits() {
    return ['NoTimestamp']
  }

  features() {
    return this.hasMany('App/Models/PremiumFeature')
  }
  planOption() {
    return this.hasMany('App/Models/TenantPaymentPlan')
  }
}

module.exports = Plan
