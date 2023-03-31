'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddAddressPublicToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table
        .boolean('full_address')
        .defaultTo(false)
        .comment('Whether we show full address to prospects or show only postcode.')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('full_address')
    })
  }
}

module.exports = AddAddressPublicToThirdPartyOffersSchema
