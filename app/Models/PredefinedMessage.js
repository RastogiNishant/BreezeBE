'use strict'

const { STATUS_DELETE } = require('../constants')
const Model = require('./BaseModel')

class PredefinedMessage extends Model {
  static get columns() {
    return ['id', 'text', 'type', 'variable_to_update', 'step', 'status']
  }

  static get readonly() {
    return ['id']
  }

  static get traits() {
    return ['NoTimestamp']
  }

  choices() {
    return this.hasMany('App/Models/PredefinedMessageChoice', 'id', 'predefined_message_id').whereNotIn('status', [STATUS_DELETE])
  }
}

module.exports = PredefinedMessage
