'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIsUsedFilterSchema extends Schema {
  up () {
    this.table('filter_columns', (table) => {
      // alter table
      table.boolean('is_used_filter').defaultTo(false)
    })
  }

  down () {
    this.table('filter_columns', (table) => {
      // reverse alternations
      table.dropColumn('is_used_filter')
    })
  }
}

module.exports = AddIsUsedFilterSchema
