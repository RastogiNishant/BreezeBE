'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddHeatingTypeOnThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.specificType('heating_type', 'INT[]')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      table.dropColumn('heating_type')
    })
  }
}

module.exports = AddHeatingTypeOnThirdPartyOffersSchema
