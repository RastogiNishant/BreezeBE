'use strict'

const Model = require('./BaseModel')

class File extends Model {
  static get columns() {
    return ['url', 'estate_id', 'type', 'file_name', 'order', 'disk', 'file_format']
  }

  static get traits() {
    return ['NoTimestamp']
  }

  static get Serializer() {
    return 'App/Serializers/FileSerializer'
  }
}

module.exports = File
