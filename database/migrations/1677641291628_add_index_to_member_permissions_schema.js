'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToMemberPermissionsSchema extends Schema {
  up() {
    this.table('member_permissions', (table) => {
      // alter table
      table.index('member_id')
      table.index('user_id')
      table.index(['member_id', 'user_id'])
    })
  }

  down() {
    this.table('member_permissions', (table) => {
      // reverse alternations
      table.dropIndex('member_id')
      table.dropIndex('user_id')
      table.dropIndex(['member_id', 'user_id'])
    })
  }
}

module.exports = AddIndexToMemberPermissionsSchema
