'use strict'

const Model = require('./BaseModel')
class TenantCertificate extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'city_id',
      'income_level',
      'attachments',
      'expired_at',
      'created_at',
      'updated_at',
    ]
  }

  static get Serializer() {
    return 'App/Serializers/TenantCertificateSerializer'
  }
}

module.exports = TenantCertificate
