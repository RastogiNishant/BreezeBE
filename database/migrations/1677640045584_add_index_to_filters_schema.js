'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToFiltersSchema extends Schema {
  up() {
    this.table('filter_columns', (table) => {
      // alter table
      table.index('filterName')
    })
  }

  down() {
    this.table('filter_columns', (table) => {
      // reverse alternations
      table.dropIndex('filterName')
    })
  }
}

module.exports = AddIndexToFiltersSchema
