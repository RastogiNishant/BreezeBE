'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEmailSentToContactRequestSchema extends Schema {
  up() {
    this.table('estate_sync_contact_requests', (table) => {
      // alter table
      table.boolean('email_sent').defaultTo(false)
    })
  }

  down() {
    this.table('estate_sync_contact_requests', (table) => {
      // reverse alternations
      table.dropColumn('email_sent')
    })
  }
}

module.exports = AddEmailSentToContactRequestSchema
