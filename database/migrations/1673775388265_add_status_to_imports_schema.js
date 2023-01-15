'use strict'

const { IMPORT_ACTIVITY_PENDING, IMPORT_ACTIVITY_DONE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusToImportsSchema extends Schema {
  up() {
    this.table('imports', (table) => {
      // alter table
      table.enum('status', [IMPORT_ACTIVITY_PENDING, IMPORT_ACTIVITY_DONE])
    })
  }

  down() {
    this.table('imports', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddStatusToImportsSchema
