'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCreditCardProofsSchema extends Schema {
  up() {
    this.create('add_credit_card_proofs', (table) => {
      table.increments()
      table
        .integer('prospect_credit_score_id')
        .unsigned()
        .references('id')
        .inTable('prospect_credit_scores')
        .index()
      table.string('url')
      table.string('filename')
      table.string('file_format')
      table.timestamps()
    })
  }

  down() {
    this.drop('add_credit_card_proofs')
  }
}

module.exports = AddCreditCardProofsSchema
