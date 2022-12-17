'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUserIndexSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.index(['email', 'role'], 'email_row_index')
      table.index('email')
      table.index('owner_id')
      table.index('company_id')
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse
      table.dropIndex(['email', 'role'], 'email_row_index')
      table.dropIndex('email')
      table.dropIndex('owner_id')
      table.dropIndex('company_id')
    })
  }
}

module.exports = AddUserIndexSchema
