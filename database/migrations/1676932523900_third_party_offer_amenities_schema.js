'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyOfferAmenitiesSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.specificType('amenities', 'text array')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      table.dropColumn('amenities')
    })
  }
}

module.exports = ThirdPartyOfferAmenitiesSchema
