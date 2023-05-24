'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToRoomsSchema extends Schema {
  up() {
    this.table('rooms', (table) => {
      // alter table
      table.index(['estate_id', 'status'])
    })
  }

  down() {
    this.table('rooms', (table) => {
      // reverse alternations
      table.dropIndex(['estate_id', 'status'])
    })
  }
}

module.exports = AddIndexToRoomsSchema
