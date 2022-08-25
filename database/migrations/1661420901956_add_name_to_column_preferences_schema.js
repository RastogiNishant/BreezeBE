'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNameToColumnPreferencesSchema extends Schema {
  up () {
    this.table('filter_columns', (table) => {
      // alter table
      table.string('name')
      table.boolean('default_visible').default(true)
    })
  }

  down () {
    this.table('filter_columns', (table) => {
      // reverse alternations
      table.dropColumn('name')
      table.dropColumn('default_visible')
    })
  }
}

module.exports = AddNameToColumnPreferencesSchema
