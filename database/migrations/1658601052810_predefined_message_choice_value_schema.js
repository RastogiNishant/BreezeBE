'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PredefinedMessageChoiceValueSchema extends Schema {
  up() {
    this.table('predefined_message_choices', (table) => {
      table.string('value').nullable()
    })
  }

  down() {}
}

module.exports = PredefinedMessageChoiceValueSchema
