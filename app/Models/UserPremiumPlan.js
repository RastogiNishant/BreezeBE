'use strict'

const Model = require('./BaseModel')

class UserPremiumPlan extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'plan_id',
    ]
  }
  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
  plan() {
    return this.belongsTo('App/Models/Plan', 'plan_id', 'id')
  }  
}

module.exports = UserPremiumPlan
