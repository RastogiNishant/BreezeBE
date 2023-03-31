'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddVantFromToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.string('vacant_from_string')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      table.dropColumn('vacant_from_string')
    })
  }
}

module.exports = AddVantFromToThirdPartyOffersSchema
