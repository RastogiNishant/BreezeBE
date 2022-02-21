'use strict'

const Model = require('./BaseModel')

class EstateReportAbuse extends Model {
  static get columns() {
    return ['id', 'user_id', 'estate_id', 'abuse']
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = EstateReportAbuse
