'use strict'
const Model = require('./BaseModel')

class EstateSyncListing extends Model {
  static get columns() {
    return [
      'id',
      'provider',
      'estate_id',
      'performed_by',
      'status',
      'estate_sync_property_id',
      'estate_sync_listing_id',
      'publish_url',
      'created_at',
      'updated_at',
      'posting_error',
      'publishing_error',
      'posting_error_message',
      'publishing_error_message',
      'publishing_error_type',
      'user_connected'
    ]
  }
}

module.exports = EstateSyncListing
