'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MemberCreditScoreSubmitLaterOption extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.boolean('credit_score_submit_later').default(false)
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('credit_score_submit_later')
    })
  }
}

module.exports = MemberCreditScoreSubmitLaterOption
