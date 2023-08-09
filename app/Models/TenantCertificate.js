'use strict'

const Model = require('./BaseModel')
class TenantCertificate extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'city_id',
      'income_level',
      'uri',
      'file_name',
      'disk',
      'expired_at',
      'created_at',
      'updated_at',
    ]
  }
}

module.exports = TenantCertificateModel
