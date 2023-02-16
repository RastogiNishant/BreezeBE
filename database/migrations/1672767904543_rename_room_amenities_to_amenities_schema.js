'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RenameRoomAmenitiesToAmenitiesSchema extends Schema {
  up() {
    this.rename('room_amenities', 'amenities')
  }

  down() {}
}

module.exports = RenameRoomAmenitiesToAmenitiesSchema
