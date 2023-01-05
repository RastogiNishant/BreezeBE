'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddAttachmentsToCurrentTenantsSchema extends Schema {
  up() {
    this.table('estate_current_tenants', (table) => {
      // alter table
      table.json('attachments')
    })
  }

  down() {
    this.table('estate_current_tenants', (table) => {
      // reverse alternations
      table.dropColumn('attachments')
    })
  }
}

module.exports = AddAttachmentsToCurrentTenantsSchema
