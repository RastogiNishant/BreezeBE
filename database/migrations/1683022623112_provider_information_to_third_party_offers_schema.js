'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProviderInformationToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      // alter table
      table.json('source_information')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('source_information')
    })
  }
}

module.exports = ProviderInformationToThirdPartyOffersSchema
