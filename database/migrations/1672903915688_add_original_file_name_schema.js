'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOriginalFileNameSchema extends Schema {
  up() {
    this.table('files', (table) => {
      // alter table
      table.string('file_name', 254)
    })
    this.table('images', (table) => {
      // alter table
      table.string('file_name', 254)
    })
  }

  down() {}
}

module.exports = AddOriginalFileNameSchema
