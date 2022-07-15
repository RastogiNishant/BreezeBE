'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIsDeletedToPredefinedAnswersSchema extends Schema {
  up() {
    this.table('predefined_message_answers', (table) => {
      // alter table
      table.boolean('is_deleted').defaultTo(false)
    })
  }

  down() {
    this.table('predefined_message_answers', (table) => {
      // reverse alternations
      table.dropColumn('is_deleted')
    })
  }
}

module.exports = AddIsDeletedToPredefinedAnswersSchema
