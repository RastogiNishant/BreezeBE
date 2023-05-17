'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ChangeToStringSourceIdThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      // alter table
      table.string('source_id').alter()
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ChangeToStringSourceIdThirdPartyOffersSchema
