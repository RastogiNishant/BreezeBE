'use strict'

const { SALUTATION_SIR_OR_MADAM_LABEL } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTitleToContactsSchema extends Schema {
  up() {
    this.table('contacts', (table) => {
      // alter table
      table.string('title').defaultTo(SALUTATION_SIR_OR_MADAM_LABEL)
    })
  }

  down() {
    this.table('contacts', (table) => {
      // reverse alternations
      table.dropColumn('title')
    })
  }
}

module.exports = AddTitleToContactsSchema
