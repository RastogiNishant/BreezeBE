'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCommentToFieldsMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      table.specificType('debt_proof', 'text[]').comment('This is the credit score proofs.').alter()
      table.string('rent_arrears_doc', 255).comment('This is the NO rent arrears proof').alter()
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddCommentToFieldsMembersSchema
