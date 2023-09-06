'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCreditHistoryStatusCreditScoreDateMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table
        .integer('credit_history_status')
        .comment('1 - no negative data, 2 - some negative data, 3 - enforceable claims')
      table.date('credit_score_issued_at')
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('credit_history_status')
      table.dropColumn('credit_score_issued_at')
    })
  }
}

module.exports = AddCreditHistoryStatusCreditScoreDateMembersSchema
