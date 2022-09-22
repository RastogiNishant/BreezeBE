'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddChatIdOnPredefinedAnswerSchema extends Schema {
  up() {
    this.table('predefined_message_answers', (table) => {
      // alter table
      table.integer('chat_id').nullable().index()
      table.foreign('chat_id').references('id').on('chats').onDelete('cascade')
      //index predefined_message_id - postgres doesn't index foreign keys
      table.integer('predefined_message_id').alter().index()
      //index task_id = this is being searched and not indexed. Foreign keys are also not indexed
      table.integer('task_id').alter().index()
    })
  }

  down() {
    this.table('predefined_message_answers', (table) => {
      // reverse alternations
      table.dropColumn('chat_id')
      table.dropIndex('predefined_message_id')
      table.dropIndex('task_id')
    })
  }
}

module.exports = AddChatIdOnPredefinedAnswerSchema
