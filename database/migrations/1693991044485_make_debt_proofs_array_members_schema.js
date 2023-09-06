'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeDebtProofsArrayMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.specificType('credit_score_proofs', 'text[]')
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('credit_score_proofs')
    })
  }
}

module.exports = MakeDebtProofsArrayMembersSchema
