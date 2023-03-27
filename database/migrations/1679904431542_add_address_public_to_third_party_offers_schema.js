'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddAddressPublicToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.boolean('address_public').defaultTo(false)
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('address_public')
    })
  }
}

module.exports = AddAddressPublicToThirdPartyOffersSchema
