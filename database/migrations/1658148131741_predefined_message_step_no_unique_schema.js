'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PredefinedMessageStepNoUniqueSchema extends Schema {
  up () {
    this.table('predefined_messages', (table) => {
      // alter table
      table.dropUnique(['step'])

    })
  }

  down () {
    this.table('predefined_messages', (table) => {
      // reverse alternations
    })
  }
}

module.exports = PredefinedMessageStepNoUniqueSchema
