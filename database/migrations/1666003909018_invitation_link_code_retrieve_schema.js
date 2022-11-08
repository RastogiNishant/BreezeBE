'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class InvitationLinkCodeRetrieveSchema extends Schema {
  up() {
    this.create('invitation_link_codes', (table) => {
      table.increments()
      table.integer('current_tenant_id').references('id').inTable('estate_current_tenants')
      table.string('code', 10).unique().index()
      table.string('link', 120)
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down() {
    this.drop('invitation_link_codes')
  }
}

module.exports = InvitationLinkCodeRetrieveSchema
