'use strict'

const Model = require('./BaseModel')

class Like extends Model {
  /**
   *
   */
  static get columns() {
    return ['id', 'user_id', 'estate_id']
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'user_id', 'estate_id']
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = Like
