'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusToLetterTemplateSchema extends Schema {
  up() {
    this.table('letter_templates', (table) => {
      // alter table
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
    })
  }

  down() {
    this.table('letter_templates', (table) => {
      // reverse alternations
      table.dropColumn('status')
    })
  }
}

module.exports = AddStatusToLetterTemplateSchema
