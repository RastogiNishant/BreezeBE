'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPropertyIdToThirdPartyOfferSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      // alter table
      table.string('property_id')
      table
        .string('ftp_last_update')
        .comment('string so we can immediately compare with the bucket listing')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('property_id')
      table.dropColumn('ftp_last_update')
    })
  }
}

module.exports = AddPropertyIdToThirdPartyOfferSchema
