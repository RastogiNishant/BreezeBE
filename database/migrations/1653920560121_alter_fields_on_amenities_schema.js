'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterFieldsOnAmenitiesSchema extends Schema {
  up() {
    this.table('amenities', (table) => {
      // alter table
      table.integer('room_id').unsigned().nullable().alter()
      table.integer('estate_id').unsigned().nullable()
      table.string('location', 32).index()
    })
  }

  down() {
    this.table('amenities', (table) => {
      // reverse alternations
      table.integer('room_id').unsigned().notNullable().alter()
      table.dropColumn('estate_id')
      table.dropColumn('location')
    })
  }
}

module.exports = AlterFieldsOnAmenitiesSchema
