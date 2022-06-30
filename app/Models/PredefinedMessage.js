'use strict'

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

  messageChoices() {
    return this.hasMany('App/Models/PredefinedMessageChoice')
  }  
}

module.exports = PredefinedMessage