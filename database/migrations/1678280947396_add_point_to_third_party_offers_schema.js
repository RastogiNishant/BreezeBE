'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPointToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.integer('point_id').unsigned().references('id').inTable('points')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      table.dropColumn('point_id')
    })
  }
}

module.exports = AddPointToThirdPartyOffersSchema
