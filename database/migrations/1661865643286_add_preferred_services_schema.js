'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPreferredServicesSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.string('preferred_services', 50)
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('preferred_services')
    })
  }
}

module.exports = AddPreferredServicesSchema
