'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFinalMatchDateToMatchSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.datetime('final_match_date', { useTz: false })
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
      table.dropColumn('final_match_date')
    })
  }
}

module.exports = AddFinalMatchDateToMatchSchema
