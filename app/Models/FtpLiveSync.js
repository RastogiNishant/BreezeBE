'use strict'

const Model = require('./BaseModel')

class FtpLiveSync extends Model {
  static get columns() {
    return ['user_id', 'company', 'email', 'status']
  }

  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = FtpLiveSync
