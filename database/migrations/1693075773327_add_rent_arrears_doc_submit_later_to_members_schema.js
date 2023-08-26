'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddRentArrearsDocSubmitLaterToMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.boolean('rent_arrears_doc_submit_later').defaultTo(false)
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('rent_arrears_doc_submit_later')
    })
  }
}

module.exports = AddRentArrearsDocSubmitLaterToMembersSchema
