'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCreditScoreProofsSchema extends Schema {
  up() {
    this.create('credit_score_proofs', (table) => {
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
    this.drop('credit_score_proofs')
  }
}

module.exports = AddCreditScoreProofsSchema
