'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddLinkToContactRequestSchema extends Schema {
  up() {
    this.table('estate_sync_contact_requests', (table) => {
      // alter table
      table.string('link')
    })
  }

  down() {
    this.table('estate_sync_contact_requests', (table) => {
      // reverse alternations
      table.dropColumn('link')
    })
  }
}

module.exports = AddLinkToContactRequestSchema
