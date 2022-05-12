'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class RoomAmenity extends Model {
  static get columns() {
    return [
      'id',
      'room_id',
      'options_id',
      'amenity',
      'status',
      'sequence_order',
      'added_by',
      'type',
    ]
  }

  added_by() {
    return this.belongsTo('App/Models/User', 'added_by', 'id')
  }

  room() {
    return this.belongsTo('App/Models/Room', 'room_id', 'id')
  }
}

module.exports = RoomAmenity
