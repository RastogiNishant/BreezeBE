'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyOfferInteractionsSchema extends Schema {
  up() {
    this.create('third_party_offer_interactions', (table) => {
      table.increments()
      table.integer('user_id').references('id').on('users').index()
      table.integer('third_party_offer_id').references('id').on('third_party_offers').index()
      table.boolean('liked').comment('true if liked, false if unliked, null if none')
      table.string('comment', 1000)
      table.timestamps()
    })
  }

  down() {
    this.drop('third_party_offer_interactions')
  }
}

module.exports = ThirdPartyOfferInteractionsSchema
