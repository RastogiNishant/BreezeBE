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
      'hash',
      'is_invited_by_landlord',
      'other_info',
      'publisher',
      'reminders_to_convert',
      'last_reminder_at'
    ]
  }

  estate() {
    return this.hasOne('App/Models/Estate', 'estate_id', 'id')
  }

  static get Serializer() {
    return 'App/Serializers/MarketPlaceSerializer'
  }
}

module.exports = EstateSyncContactRequest
