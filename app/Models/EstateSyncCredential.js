'use strict'

const Model = require('./BaseModel')

class EstateSyncCredential extends Model {
  static get columns() {
    return ['id', 'user_id', 'type', 'estate_sync_contact_id']
  }
}

module.exports = EstateSyncCredential
