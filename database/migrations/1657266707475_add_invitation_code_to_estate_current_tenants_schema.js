'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddInvitationCodeToEstateCurrentTenantsSchema extends Schema {
  up() {
    this.table('estate_current_tenants', (table) => {
      // alter table
      table.string('code', 60)
    })
  }

  down() {
    this.table('estate_current_tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddInvitationCodeToEstateCurrentTenantsSchema
