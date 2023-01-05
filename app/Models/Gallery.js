'use strict'

const Model = require('./BaseModel')

class Gallery extends Model {
  static get columns() {
    return ['user_id', 'original_file_name', 'url', 'disk', 'status']
  }

  static get traits() {
    return ['NoTimestamp']
  }

  static get Serializer() {
    return 'App/Serializers/GallerySerializer'
  }
}

module.exports = Gallery
