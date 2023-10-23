'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCreditScoreNotApplicableToMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.boolean('credit_score_not_applicable').defaultTo(false)
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('credit_score_not_applicable')
    })
  }
}

module.exports = AddCreditScoreNotApplicableToMembersSchema
