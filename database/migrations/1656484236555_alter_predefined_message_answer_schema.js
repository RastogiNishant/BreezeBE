'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AlterPredefinedMessageAnswerSchema extends Schema {
  async up() {

    await Database.raw(
      `ALTER TABLE IF EXISTS predefined_message_answers 
      DROP CONSTRAINT IF EXISTS predefined_message_answers_question_id_foreign; `
    )

    this.table('predefined_message_answers', async (table) => {
      // And now recreate it

      table.dropColumn('question_id')
      table.integer('predefined_message_id').unsigned().notNullable().references('id').inTable('predefined_messages')      
    })
  }

  down() {
    this.table('predefined_message_answers', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterPredefinedMessageAnswerSchema
