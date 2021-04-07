'use strict'

const Model = require('./BaseModel')

class Room extends Model {
  static get columns() {
    return ['id', 'estate_id', 'type', 'area', 'status', 'options']
  }

  static get readonly() {
    return ['id', 'status', 'estate_id']
  }

  static get Serializer() {
    return 'App/Serializers/RoomSerializer'
  }

  estate() {
    return this.belongsTo('App/Models/Estate', 'estate_id', 'id')
  }
}

module.exports = Room
