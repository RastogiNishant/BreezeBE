'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ChangeRoomAmenitiesToAmenitiesSchema extends Schema {
  up() {
    this.rename('room_amenities', 'amenities')
  }

  down() {
    this.table('change_room_amenities_to_amenities', (table) => {
      this.rename('amenities', 'room_amenities')
    })
  }
}

module.exports = ChangeRoomAmenitiesToAmenitiesSchema
