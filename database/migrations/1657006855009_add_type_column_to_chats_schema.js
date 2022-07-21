'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTypeColumnToChatsSchema extends Schema {
  up() {
    this.table('chats', (table) => {
      table.enum('type', ['message', 'notification', 'last-read-marker'])
    })
  }

  down() {
    this.table('chats', (table) => {
      // reverse alternations
      table.dropColumn('type')
    })
  }
}

module.exports = AddTypeColumnToChatsSchema
