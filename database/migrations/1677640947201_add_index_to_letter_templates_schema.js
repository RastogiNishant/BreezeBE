'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToLetterTemplatesSchema extends Schema {
  up() {
    this.table('letter_templates', (table) => {
      // alter table
      table.index('user_id')
      table.index('company_id')
      table.index(['user_id', 'company_id', 'status'])
    })
  }

  down() {
    this.table('letter_templates', (table) => {
      // reverse alternations
      table.dropIndex('user_id')
      table.dropIndex('company_id')
      table.dropIndex(['user_id', 'company_id', 'status'])
    })
  }
}

module.exports = AddIndexToLetterTemplatesSchema
