'use strict'

const Model = require('./BaseModel')

class UserPremiumPlan extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'premium_id',
    ]
  }
  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
  premium() {
    return this.belongsTo('App/Models/PremiumFeature', 'premium_id', 'id')
  }  
}

module.exports = UserPremiumPlan
