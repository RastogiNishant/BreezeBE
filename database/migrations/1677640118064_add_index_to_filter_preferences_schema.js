'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToFilterPreferencesSchema extends Schema {
  up() {
    this.table('filter_columns_preferences', (table) => {
      // alter table
      table.index('user_id')
      table.index('filter_columns_id')
    })
  }

  down() {
    this.table('filter_columns_preferences', (table) => {
      // reverse alternations
      table.dropIndex('user_id')
      table.dropIndex('filter_columns_id')

    })
  }
}

module.exports = AddIndexToFilterPreferencesSchema
