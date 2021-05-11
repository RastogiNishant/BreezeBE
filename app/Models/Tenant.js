'use strict'

const Model = require('./BaseModel')

class Tenant extends Model {
  static get columns() {
    return ['id', 'user_id', 'private_use', 'pets', 'pets_species', 'parking_space']
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'user_id']
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
}

module.exports = Tenant
