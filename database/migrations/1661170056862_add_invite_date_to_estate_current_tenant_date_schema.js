'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddInviteDateToEstateCurrentTenantDateSchema extends Schema {
  up() {
    this.table('estate_current_tenants', (table) => {
      // alter table
      table.datetime('invite_sent_at', { useTz: false })
    })
  }

  down() {
    this.table('estate_current_tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddInviteDateToEstateCurrentTenantDateSchema
