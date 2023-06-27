'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')
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
      'status',
      'link',
      'is_invited_by_landlord',
    ]
  }

  estate() {
    return this.hasOne('App/Models/Estate', 'estate_id', 'id')
  }
}

module.exports = EstateSyncContactRequest
