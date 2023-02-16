'use strict'

const Model = require('./BaseModel')

class PredefinedMessageAnswer extends Model {
  static get columns() {
    return [
      'id',
      'task_id',
      'predefined_message_id',
      'predefined_message_choice_id',
      'text',
      'is_deleted',
      'chat_id',
    ]
  }

  static get readonly() {
    return ['id']
  }

  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = PredefinedMessageAnswer
