'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddImportSequenceToRoomsSchema extends Schema {
  up() {
    this.table('rooms', (table) => {
      table.integer('import_sequence').nullable()
    })
  }

  down() {
    this.table('rooms', (table) => {
      // reverse alternations
      table.dropColumn('import_sequence')
    })
  }
}

module.exports = AddImportSequenceToRoomsSchema
