'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToPredefinedMessageAnswersSchema extends Schema {
  up() {
    this.table('predefined_message_answers', (table) => {
      // alter table
      table.index(['task_id', 'is_deleted'])
    })
  }

  down() {
    this.table('predefined_message_answers', (table) => {
      // reverse alternations
      table.dropIndex(['task_id', 'is_deleted'])
    })
  }
}

module.exports = AddIndexToPredefinedMessageAnswersSchema
