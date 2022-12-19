'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeIndexToTaskSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      // alter table
      table.index('estate_id')
      table.index('tenant_id')
      table.index('urgency')
      table.index('creator_role')
      table.index('status_changed_by')
      table.index('status')
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
    })
  }
}

module.exports = MakeIndexToTaskSchema
