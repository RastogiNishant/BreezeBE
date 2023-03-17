'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddContactInfoToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      // alter table
      table.json('contact')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('contact')
    })
  }
}

module.exports = AddContactInfoToThirdPartyOffersSchema
