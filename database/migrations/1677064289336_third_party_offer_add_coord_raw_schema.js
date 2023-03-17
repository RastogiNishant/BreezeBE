'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyOfferAddCoordRawSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.string('coord_raw', 255)
    })
  }

  down() {
    this.table('third_party_offer_add_coord_raws', (table) => {
      table.dropColumn('coord_raw')
    })
  }
}

module.exports = ThirdPartyOfferAddCoordRawSchema
