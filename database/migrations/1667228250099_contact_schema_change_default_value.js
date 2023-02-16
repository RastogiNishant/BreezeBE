'use strict'

const { SALUTATION_SIR_OR_MADAM_LABEL } = require('../../app/constants')
const Contact = require('../../app/Models/Contact')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTitleToContactsSchema extends Schema {
  up() {
    this.table('contacts', async (table) => {
      // alter table
      await Contact.query().whereNotNull('title').update({ title: null })
      table.integer('title').defaultTo(GENDER_ANY).alter()
    })
  }

  down() {
    this.table('contacts', async (table) => {
      // reverse alternations
      await Contact.query().whereNotNull('title').update({ title: null })
      table.string('title').defaultTo(SALUTATION_SIR_OR_MADAM_LABEL).alter()
    })
  }
}

module.exports = AddTitleToContactsSchema
