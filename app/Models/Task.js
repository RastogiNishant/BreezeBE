'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')
class Task extends Model {
  static get columns() {
    return [
      'id',
      'title',
      'estate_id',
      'tenant_id',
      'urgency',
      'creator_role',
      'status',
      'attachments',
      'description',
      'next_predefined_message_id',
      'created_at',
      'updated_at',
      'status_changed_by',
      'unread_count',
      'unread_role',
      'first_not_read_chat_id',
      'email',
      'property_address',
      'address_detail',
      'landlord_identify_key',
    ]
  }
  static get readonly() {
    return ['id']
  }

  static get Serializer() {
    return 'App/Serializers/TaskSerializer'
  }

  estate() {
    return this.belongsTo('App/Models/Estate', 'estate_id', 'id')
  }

  user() {
    return this.belongsTo('App/Models/User', 'tenant_id', 'id')
  }
}

module.exports = Task
