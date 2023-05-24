'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeAreaDecimalThirdPartyOfferSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      // alter table
      table.decimal('area', 8, 2).alter()
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.integer('area').alter()
    })
  }
}

module.exports = MakeAreaDecimalThirdPartyOfferSchema
