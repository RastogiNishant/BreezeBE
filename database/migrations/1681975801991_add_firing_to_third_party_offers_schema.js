'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFiringToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.specificType('firing', 'INT[]')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('firing')
    })
  }
}

module.exports = AddFiringToThirdPartyOffersSchema
