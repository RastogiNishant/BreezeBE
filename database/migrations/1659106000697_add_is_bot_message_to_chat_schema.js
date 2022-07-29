'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIsBotMessageToChatSchema extends Schema {
  up () {
    this.table('chats', (table) => {
      // alter table
      table.boolean('is_bot_message').default(false)
    })
  }

  down () {
    this.table('chats', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddIsBotMessageToChatSchema
