'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { IMPORT_ACTION_IMPORT } = require('../../app/constants')

class AddActionToImportSchema extends Schema {
  up() {
    this.table('imports', (table) => {
      table.string('action', 10).defaultTo(IMPORT_ACTION_IMPORT)
    })
  }

  down() {
    this.table('imports', (table) => {
      // reverse alternations
      table.dropColumn('action')
    })
  }
}

module.exports = AddActionToImportSchema
