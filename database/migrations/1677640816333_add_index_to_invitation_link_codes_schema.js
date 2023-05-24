'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToInvitationLinkCodesSchema extends Schema {
  up() {
    this.table('invitation_link_codes', (table) => {
      // alter table
      table.index('current_tenant_id')
    })
  }

  down() {
    this.table('invitation_link_codes', (table) => {
      // reverse alternations
      table.dropIndex('current_tenant_id')
    })
  }
}

module.exports = AddIndexToInvitationLinkCodesSchema
