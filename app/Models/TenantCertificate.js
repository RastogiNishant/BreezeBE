'use strict'

const Model = require('./BaseModel')
class TenantCertificateModel extends Model {
  static get columns() {
    return ['id', 'user_id', 'city_id', 'income_level', 'expired_at', 'created_at', 'updated_at']
  }
}

module.exports = TenantCertificateModel
