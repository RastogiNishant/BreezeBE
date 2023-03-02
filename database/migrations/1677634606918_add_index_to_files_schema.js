'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToFilesSchema extends Schema {
  up() {
    this.table('files', (table) => {
      // alter table
      table.index(['estate_id', 'type'])
    })
  }

  down() {
    this.table('files', (table) => {
      // reverse alternations
      table.dropIndex(['estate_id', 'type'])
    })
  }
}

module.exports = AddIndexToFilesSchema
