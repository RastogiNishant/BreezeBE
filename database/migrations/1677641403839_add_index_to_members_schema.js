'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.index('user_id')
      table.index('owner_user_id')
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
      table.dropIndex('user_id')
      table.dropIndex('owner_user_id')
    })
  }
}

module.exports = AddIndexToMembersSchema
