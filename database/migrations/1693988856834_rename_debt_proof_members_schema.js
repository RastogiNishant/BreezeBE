'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RenameDebtProofMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.renameColumn('debt_proof', 'debt_proof_2')
    })
  }

  down() {}
}

module.exports = RenameDebtProofMembersSchema
