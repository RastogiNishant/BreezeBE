'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IndexChatCreateAtSchema extends Schema {
  up() {
    this.table('chats', (table) => {
      // alter table
      // index created_at
      table.index('created_at')
    })
  }

  down() {
    this.table('chats', (table) => {
      // reverse alternations
    })
  }
}

module.exports = IndexChatCreateAtSchema
