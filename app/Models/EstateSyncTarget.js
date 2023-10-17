'use strict'

const Model = require('./BaseModel')

class EstateSyncTarget extends Model {
  static get columns() {
    return [
      'id',
      'estate_sync_credential_id',
      'publishing_provider',
      'estate_sync_target_id',
      'created_at',
      'updated_at',
      'status'
    ]
  }
}

module.exports = EstateSyncTarget
