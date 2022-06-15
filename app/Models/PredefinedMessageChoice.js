'use strict'

const Model = require('./BaseModel')

class PredefinedMessageChoice extends Model {
  static get columns() {
    return ['id', 'predefined_message_id', 'text', 'next_predefined_message_id', 'status']
  }

  static get readonly() {
    return ['id']
  }

  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = PredefinedMessageChoice
