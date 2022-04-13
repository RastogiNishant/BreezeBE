'use strict'

const Model = require('./BaseModel')

class TenantReportAbuse extends Model {
  static get columns() {
    return ['id', 'landlord_id', 'estate_id', 'tenant_id', 'abuse']
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = TenantReportAbuse
