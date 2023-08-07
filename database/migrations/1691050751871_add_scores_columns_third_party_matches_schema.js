'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddScoresColumnsThirdPartyMatchesSchema extends Schema {
  up() {
    this.table('third_party_matches', (table) => {
      table.decimal('prospect_score', 5, 2).comment('scoreT')
      table.decimal('landlord_score', 5, 2).comment('scoreL')
    })
  }

  down() {
    this.table('third_party_matches', (table) => {
      table.dropColumn('prospect_score')
      table.dropColumn('landlord_score')
    })
  }
}

module.exports = AddScoresColumnsThirdPartyMatchesSchema
