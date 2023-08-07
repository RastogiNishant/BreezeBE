'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddScoresColumnsMatchesSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.decimal('prospect_score', 5, 2).comment('scoreT')
      table.decimal('landlord_score', 5, 2).comment('scoreL')
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
      table.dropColumn('prospect_score')
      table.dropColumn('landlord_score')
    })
  }
}

module.exports = AddScoresColumnsMatchesSchema
