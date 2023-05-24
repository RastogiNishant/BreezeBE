'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDurationsToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.integer('duration_rent_min')
      table.integer('duration_rent_max')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      table.dropColumn('duration_rent_min')
      table.dropColumn('duration_rent_max')
    })
  }
}

module.exports = AddDurationsToThirdPartyOffersSchema
