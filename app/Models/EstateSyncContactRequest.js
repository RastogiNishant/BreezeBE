'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class EstateSyncContactRequest extends Model {
  static get columns() {
    return [
      'id',
      'email',
      'contact_info',
      'message',
      'user_id',
      'estate_id',
      'code',
      'created_at',
      'updated_at',
    ]
  }
}

module.exports = EstateSyncContactRequest
