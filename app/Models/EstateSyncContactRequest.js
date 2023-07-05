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
      'other_info',
      'publisher',
    ]
  }

  estate() {
    return this.hasOne('App/Models/Estate', 'estate_id', 'id')
  }

  static get Serializer() {
    return 'App/Serializers/BaseSerializer'
  }
}

module.exports = EstateSyncContactRequest
