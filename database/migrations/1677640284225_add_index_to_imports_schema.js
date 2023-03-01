'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToImportsSchema extends Schema {
  up() {
    this.table('imports', (table) => {
      // alter table
      table.index('user_id')
      table.index(['user_id', 'type', 'status'])
    })
  }

  down() {
    this.table('imports', (table) => {
      // reverse alternations
      table.dropIndex('user_id')
      table.dropIndex(['user_id', 'type', 'status'])
    })
  }
}

module.exports = AddIndexToImportsSchema
