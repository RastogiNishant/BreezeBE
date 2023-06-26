'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddInvitedByToEstateSyncContactRequestSchema extends Schema {
  up() {
    this.table('estate_sync_contact_requests', (table) => {
      // alter table
      table.boolean('is_invited_by_landlord').defaultTo(false)
    })
  }

  down() {
    this.table('estate_sync_contact_requests', (table) => {
      // reverse alternations
      table.dropColumn('is_invited_by_landlord')
    })
  }
}

module.exports = AddInvitedByToEstateSyncContactRequestSchema
