'use strict'

const Model = require('./BaseModel')

class Match extends Model {
  static get columns() {
    return [
      'estate_id',
      'user_id',
      'status',
      'percent',
      'knocked_at',
      'status_at',
      'final_match_date',
      'prospect_score',
      'landlord_score',
    ]
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
  tenant() {
    return this.belongsTo('App/Models/Tenant', 'user_id', 'user_id')
  }
  estate() {
    return this.belongsTo('App/Models/Estate', 'estate_id', 'id');
  }
}

module.exports = Match
