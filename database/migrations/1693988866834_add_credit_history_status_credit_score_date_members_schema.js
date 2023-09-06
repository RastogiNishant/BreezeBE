'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCreditHistoryStatusCreditScoreDateMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      this.integer('credit_history_status').comment(
        '1 - no negative data, 2 - some negative data, 3 - enforceable claims'
      )
      this.date('credit_score_issued_at')
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      this.dropColumn('credit_history_status')
      this.dropColumn('credit_score_issued_at')
    })
  }
}

module.exports = AddCreditHistoryStatusCreditScoreDateMembersSchema
