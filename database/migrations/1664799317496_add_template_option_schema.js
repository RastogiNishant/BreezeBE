'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTemplateOptionSchema extends Schema {
  up() {
    this.table('letter_templates', (table) => {
      // alter table
      table.integer('greeting_option')
    })
  }

  down() {
    this.table('letter_templates', (table) => {
      // reverse alternations
      table.dropColumn('greeting_option')
    })
  }
}

module.exports = AddTemplateOptionSchema
