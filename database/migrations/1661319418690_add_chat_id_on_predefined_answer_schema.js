'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddChatIdOnPredefinedAnswerSchema extends Schema {
  up() {
    this.table('predefined_message_answers', (table) => {
      // alter table
      table.integer('chat_id').nullable()
      table.foreign('chat_id').references('id').on('chats').onDelete('cascade')
    })
  }

  down() {
    this.table('predefined_message_answers', (table) => {
      // reverse alternations
      table.dropColumn('chat_id')
    })
  }
}

module.exports = AddChatIdOnPredefinedAnswerSchema
