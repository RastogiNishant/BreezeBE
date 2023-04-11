'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddBuildingStatusToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.smallint('building_status')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      table.dropColumn('building_status')
    })
  }
}

module.exports = AddBuildingStatusToThirdPartyOffersSchema
