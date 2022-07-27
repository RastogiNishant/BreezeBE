'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddChatIdToPredefinedMessageAnswerSchema extends Schema {
  up () {
    this.table('predefined_message_answers', (table) => {
      // alter table
      table
        .integer('chat_id')
        .unsigned()
        .references('id')
        .inTable('chats')

    })
  }

  down () {
    this.table('predefined_message_answers', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddChatIdToPredefinedMessageAnswerSchema
