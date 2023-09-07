'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemoveDebtProof2MembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      table.dropColumn('debt_proof_2')
    })
  }

  down() {}
}

module.exports = RemoveDebtProof2MembersSchema
