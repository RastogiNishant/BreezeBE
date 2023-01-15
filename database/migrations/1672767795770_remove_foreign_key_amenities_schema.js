'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemoveForeignKeyAmenitiesSchema extends Schema {
  up() {
    this.table('room_amenities', (table) => {
      // alter table
      table.dropForeign('room_id')
    })
  }

  down() {
    this.table('room_amenities', (table) => {
      // reverse alternations
    })
  }
}

module.exports = RemoveForeignKeyAmenitiesSchema
