'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')
class EstateSyncContactRequest extends Model {
  static get columns() {
    return ['id', 'email', 'contact_info', 'message', 'user_id', 'estate_id', 'code', 'status']
  }
}

module.exports = EstateSyncContactRequest
