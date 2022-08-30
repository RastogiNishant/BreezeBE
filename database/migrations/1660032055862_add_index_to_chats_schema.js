'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToChatsSchema extends Schema {
  up() {
    this.table('chats', (table) => {
      // alter table
      table.index('task_id')
      table.index('type')
    })
  }

  down() {
    this.table('chats', (table) => {
      // reverse alternations
      table.dropIndex('task_id')
      table.dropIndex('type')
    })
  }
}

module.exports = AddIndexToChatsSchema
