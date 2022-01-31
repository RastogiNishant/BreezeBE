'use strict'

const Model = require('./BaseModel')

class PremiumFeature extends Model {
  static get columns() {
    return [
      'id',
      'feature',
      'description',
      'plan_id',
      'prices',
      'status'
    ]
  }

  plan() {
    return this.belongsTo('App/Models/Plan', 'plan_id', 'id')
  }

  /**
   *
   */
   static get traits() {
    return ['NoTimestamp']
  }  
}

module.exports = PremiumFeature
