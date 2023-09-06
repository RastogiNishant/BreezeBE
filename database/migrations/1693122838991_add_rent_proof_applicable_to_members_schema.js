'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddRentProofApplicableToMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.boolean('rent_proof_not_applicable').defaultTo(false)
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('rent_proof_not_applicable')
    })
  }
}

module.exports = AddRentProofApplicableToMembersSchema
