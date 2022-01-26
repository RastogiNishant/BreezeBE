'use strict'

const Model = require('./BaseModel')

class PremiumFeature extends Model {
  static get columns() {
    return [
      'id',
      'feature',
      'description',
      'is_basic_plan',
      'belong_to_basic_plan',
      'is_premium_plan',
      'belong_to_premium_plan',
      'prices',
      'status'
    ]
  }

  /**
   *
   */
   static get traits() {
    return ['NoTimestamp']
  }  
}

module.exports = PremiumFeature
