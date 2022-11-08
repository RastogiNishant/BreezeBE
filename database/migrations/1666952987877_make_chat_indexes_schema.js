'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeChatIndexesSchema extends Schema {
  up() {
    this.table('chats', (table) => {
      // alter table
      table.index('sender_id')
      table.index('receiver_id')
      table.index('edit_status')
    })
  }

  down() {
    this.table('chats', (table) => {
      // reverse alternations
    })
  }
}

module.exports = MakeChatIndexesSchema
