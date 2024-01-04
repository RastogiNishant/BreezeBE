'use strict'

const Model = require('./BaseModel')

class ContactRequestMessage extends Model {
  static get columns() {
    return ['id', 'contact_request_id', 'message', 'created_at', 'updated_at']
  }
}

module.exports = ContactRequestMessage
