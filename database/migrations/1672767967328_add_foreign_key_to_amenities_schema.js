'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddForeignKeyToAmenitiesSchema extends Schema {
  up() {
    this.alter('amenities', (table) => {
      // alter table
      table.integer('room_id').references('id').inTable('rooms').onDelete('cascade').alter()
    })
  }

  down() {
    this.table('amenities', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddForeignKeyToAmenitiesSchema
