'use strict'

const Model = require('./BaseModel')

class File extends Model {
  static get columns() {
    return ['url', 'estate_id', 'type', 'disk']
  }

  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = File
