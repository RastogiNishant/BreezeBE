'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeDebtProofsArrayMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.specificType('debt_proof', 'text[]')
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('debt_proof')
    })
  }
}

module.exports = MakeDebtProofsArrayMembersSchema
