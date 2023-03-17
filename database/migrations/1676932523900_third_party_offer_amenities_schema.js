'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyOfferAmenitiesSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.integer('source_id').alter().index()
      table.smallint('status').index()
      table.specificType('amenities', 'text array')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      table.dropColumn('status')
      table.dropColumn('amenities')
    })
  }
}

module.exports = ThirdPartyOfferAmenitiesSchema
