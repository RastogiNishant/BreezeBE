'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddProspectCreditScoresSchema extends Schema {
  up() {
    this.create('prospect_credit_scores', (table) => {
      table.increments()
      table.decimal('credit_score', 5, 2)
      table.integer('member_id').unsigned().references('id').inTable('members').index()
      table.string('other_info')
      table.string('issued_in')
      table.date('issued_at')
      table.integer('status').defaultTo(1).comment('1-active, 2-deleted, 5-draft')
      table.timestamps()
    })
  }

  down() {
    this.drop('prospect_credit_scores')
  }
}

module.exports = AddProspectCreditScoresSchema
