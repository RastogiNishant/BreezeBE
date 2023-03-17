'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddKnockOnThirdPartyInteractionsSchema extends Schema {
  up() {
    this.table('third_party_offer_interactions', (table) => {
      // alter table
      table.boolean('knocked').comment('true if prospect knocked. false/null if not.')
      table.string('inquiry', 1000)
    })
  }

  down() {
    this.table('third_party_offer_interactions', (table) => {
      // reverse alternations
      table.dropColumn('knocked')
      table.dropColumn('inquiry')
    })
  }
}

module.exports = AddKnockOnThirdPartyInteractionsSchema
