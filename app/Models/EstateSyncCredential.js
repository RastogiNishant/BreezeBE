'use strict'

const Model = require('./BaseModel')

class EstateSyncCredential extends Model {
  static get columns() {
    return ['id', 'user_id', 'type', 'estate_sync_contact_id', 'api_key']
  }
}

module.exports = EstateSyncCredential
