'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddRentEndAtToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      // alter table
      table.dateTime('rent_end_at')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // alter table
      table.dropColumn('rent_end_at')
    })
  }
}

module.exports = AddRentEndAtToThirdPartyOffersSchema
