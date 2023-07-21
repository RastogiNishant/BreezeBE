'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IndexMoreFieldsOnThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.string('country', 50).index().alter()
      table.string('city', 100).index().alter()
      table.string('zip', 10).index().alter()
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropIndex('country')
      table.dropIndex('city')
      table.dropIndex('zip')
    })
  }
}

module.exports = IndexMoreFieldsOnThirdPartyOffersSchema
