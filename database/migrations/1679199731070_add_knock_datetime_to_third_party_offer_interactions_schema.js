'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddKnockDatetimeToThirdPartyOfferInteractionsSchema extends Schema {
  up() {
    this.table('third_party_offer_interactions', (table) => {
      // alter table
      table.datetime('knocked_at', { useTz: false })
    })
  }

  down() {
    this.table('third_party_offer_interactions', (table) => {
      // reverse alternations
      table.dropColumn('knocked_at')
    })
  }
}

module.exports = AddKnockDatetimeToThirdPartyOfferInteractionsSchema
