'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddContactRequestHashKeySchema extends Schema {
  up() {
    this.table('estate_sync_contact_requests', (table) => {
      // alter table
      table.string('hash', 255)
      table.index('hash')
      table.unique('hash')
    })
  }

  down() {
    this.table('estate_sync_contact_requests', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddContactRequestHashKeySchema
