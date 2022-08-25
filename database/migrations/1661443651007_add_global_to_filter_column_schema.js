'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddGlobalToFilterColumnSchema extends Schema {
  up () {
    this.table('filter_columns', (table) => {
      // alter table
      table.boolean('used_global_search').defaultTo(false)
    })
  }

  down () {
    this.table('filter_columns', (table) => {
      // reverse alternations
      table.dropColumn('used_global_serach')
    })
  }
}

module.exports = AddGlobalToFilterColumnSchema
