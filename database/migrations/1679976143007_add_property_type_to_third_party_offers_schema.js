'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPropertyTypeToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.smallint('property_type')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      table.dropColumn('property_type')
    })
  }
}

module.exports = AddPropertyTypeToThirdPartyOffersSchema
