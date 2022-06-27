'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
class PredefinedMessageAnswersSchema extends Schema {
  up () {
    this.create('predefined_message_answers', (table) => {
      table.increments()
      table.integer('task_id').unsigned().notNullable().references('id').inTable('tasks')
      table.integer('question_id').unsigned().notNullable().references('id').inTable('predefined_message_choices')      
      table.text('text')
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down () {
    this.drop('predefined_message_answers')
  }
}

module.exports = PredefinedMessageAnswersSchema
