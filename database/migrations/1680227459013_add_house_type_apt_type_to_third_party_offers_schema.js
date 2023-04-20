'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddHouseTypeAptTypeToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      // alter table
      table.smallint('house_type')
      table.smallint('apt_type').comment('apartment type')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('house_type')
      table.dropColumn('apt_type')
    })
  }
}

module.exports = AddHouseTypeAptTypeToThirdPartyOffersSchema
