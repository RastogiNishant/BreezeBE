'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIsPublicCertificateToTenantsSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.boolean('is_public_certificate').defaultTo(false)
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
      table.dropColumn('is_public_certificate')
    })
  }
}

module.exports = AddIsPublicCertificateToTenantsSchema
