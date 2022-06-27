'use strict'

const Model = require('./BaseModel')
class Task extends Model {
  static get columns() {
    return [
      'id',
      'name',
      'estate_id',
      'tenant_id',
      'urgency',
      'creator_role',
      'status',
      'attachments',
    ]
  }
  static get readonly() {
    return ['id']
  }

  static get Serializer() {
    return 'App/Serializers/RoomSerializer'
  }

  estate() {
    return this.belongsTo('App/Models/Estate', 'estate_id', 'id')
  }

  user() {
    return this.belongsTo('App/Models/User', 'tenant_id', 'id')
  }
}

module.exports = Task
