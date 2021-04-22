'use strict'

const Model = require('./BaseModel')

class Image extends Model {
  static get columns() {
    return ['id', 'room_id', 'url', 'disk']
  }

  static get readonly() {
    return ['id', 'room_id', 'url', 'disk']
  }

  static get Serializer() {
    return 'App/Serializers/ImageSerializer'
  }

  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = Image
