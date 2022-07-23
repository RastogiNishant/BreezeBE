'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TaskNextPredefinedMessageIdSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      table
        .integer('next_predefined_message_id')
        .unsigned()
        .references('id')
        .inTable('predefined_messages')
    })
  }

  down() {}
}

module.exports = TaskNextPredefinedMessageIdSchema
