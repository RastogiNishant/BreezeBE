'use strict'
const Model = require('./BaseModel')

class EstateSyncListing extends Model {
  static get columns() {
    return [
      'id',
      'type',
      'estate_id',
      'performed_by',
      'status',
      'estate_sync_property_id',
      'estate_sync_listing_id',
      'created_at',
      'updated_at',
    ]
  }
}

module.exports = EstateSyncListing
