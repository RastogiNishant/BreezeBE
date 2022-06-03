'use strict'

const Model = require('./BaseModel')

class Match extends Model {
  static get columns() {
    return ['estate_id', 'user_id', 'status', 'percentage']
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
}

module.exports = Match
