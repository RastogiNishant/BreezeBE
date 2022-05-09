'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddMauticIdToUserSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.integer('mautic_id')
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('mautic_id')
    })
  }
}

module.exports = AddMauticIdToUserSchema
