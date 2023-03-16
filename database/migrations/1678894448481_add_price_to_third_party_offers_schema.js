'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPriceToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.decimal('price').defaultTo(0)
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('price')
    })
  }
}

module.exports = AddPriceToThirdPartyOffersSchema
