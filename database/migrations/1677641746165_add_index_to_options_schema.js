'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToOptionsSchema extends Schema {
  up() {
    this.table('options', (table) => {
      // alter table
      table.index('type')
    })
  }

  down() {
    this.table('options', (table) => {
      // reverse alternations
      table.dropIndex('type')
    })
  }
}

module.exports = AddIndexToOptionsSchema
