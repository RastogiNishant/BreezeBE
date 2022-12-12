'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToStatusSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.index(['status'], 'status_index')
      table.index(['final_match_date'], 'final_match_date_index')
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
      table.dropIndex(['status'], 'status_index')
      table.dropIndex(['final_match_date'], 'final_match_date_index')
    })
  }
}

module.exports = AddIndexToStatusSchema
