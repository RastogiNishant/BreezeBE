'use strict'

const Model = require('./BaseModel')

class Option extends Model {
  static get columns() {
    return ['id', 'type', 'title', 'order']
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
    return ['id']
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/OptionSerializer'
  }
}

module.exports = Option
