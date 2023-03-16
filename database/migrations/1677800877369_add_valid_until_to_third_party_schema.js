'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddValidUntilToThirdPartySchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      // alter table
      table.date('expiration_date')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('expiration_date')
    })
  }
}

module.exports = AddValidUntilToThirdPartySchema
