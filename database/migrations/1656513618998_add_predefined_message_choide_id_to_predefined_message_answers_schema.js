'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPredefinedMessageChoideIdToPredefinedMessageAnswersSchema extends Schema {
  up() {
    this.table('predefined_message_answers', (table) => {
      // alter table
      table
        .integer('predefined_message_choice_id')
        .unsigned()
        .references('id')
        .inTable('predefined_message_choices')
    })
  }

  down() {
    this.table('predefined_message_answers', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddPredefinedMessageChoideIdToPredefinedMessageAnswersSchema
