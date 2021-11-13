'use strict'

const Model = require('./BaseModel')

class Buddy extends Model {
  static get columns() {
    return ['id', 'name', 'phone', 'email', 'user_id']
  }

 
  /**
   * RELATIONSHIPS
   */
  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }

}

module.exports = Buddy
