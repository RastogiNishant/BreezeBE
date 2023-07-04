'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOtherInfoToEstateSyncContactRequestSchema extends Schema {
  up() {
    this.table('estate_sync_contact_requests', (table) => {
      table.json('other_info')
      table.string('publisher')
    })
  }

  down() {
    this.table('estate_sync_contact_requests', (table) => {
      // reverse alternations
      table.dropColumn('other_info')
      table.string('publisher')
    })
  }
}

module.exports = AddOtherInfoToEstateSyncContactRequestSchema
