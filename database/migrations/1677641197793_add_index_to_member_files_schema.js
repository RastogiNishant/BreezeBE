'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToMemberFilesSchema extends Schema {
  up() {
    this.table('member_files', (table) => {
      // alter table
      table.index('member_id')
      table.index(['member_id', 'type', 'status'])
    })
  }

  down() {
    this.table('member_files', (table) => {
      // reverse alternations
      table.dropIndex('member_id')
      table.dropIndex(['member_id', 'type', 'status'])
    })
  }
}

module.exports = AddIndexToMemberFilesSchema
