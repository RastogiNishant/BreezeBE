'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddMaritalStatusToMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.integer('marital_status')
      table.string('citizen')
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('marital_status')
      table.dropColumn('citizen')
    })
  }
}

module.exports = AddMaritalStatusToMembersSchema
