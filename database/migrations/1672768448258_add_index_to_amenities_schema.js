'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToAmenitiesSchema extends Schema {
  up() {
    this.alter('amenities', (table) => {
      // alter table
      table.index('room_id')
    })
  }

  down() {
    this.table('amenities', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddIndexToAmenitiesSchema
