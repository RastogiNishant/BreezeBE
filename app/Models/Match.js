'use strict'

const Model = require('./BaseModel')

class Match extends Model {
  static get columns() {
    return ['estate_id', 'user_id', 'status', 'percentage', 'knocked_at', 'final_match_date']
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
  tenant() {
    return this.belongsTo('App/Models/Tenant', 'user_id', 'user_id')
  }
}

module.exports = Match
