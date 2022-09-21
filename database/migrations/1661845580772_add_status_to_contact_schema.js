'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusToContactSchema extends Schema {
  up() {
    this.table('contacts', (table) => {
      // alter table
      table.integer('status').unsigned().index().defaultTo(STATUS_ACTIVE)
    })
  }

  down() {
    this.table('contacts', (table) => {
      // reverse alternations
      table.dropColumn('status')
    })
  }
}

module.exports = AddStatusToContactSchema
