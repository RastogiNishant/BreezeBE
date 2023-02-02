'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RenameAmenitiesCascadeRoomSchema extends Schema {
  up() {
    this.rename('amenities', 'room_amenities')
  }

  down() {}
}

module.exports = RenameAmenitiesCascadeRoomSchema
