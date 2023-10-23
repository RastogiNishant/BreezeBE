'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TenantCertificateCanBeNullSchema extends Schema {
  up() {
    this.alter('tenant_certificates', (table) => {
      table.json('attachments').nullable().alter()
    })
  }

  down() {}
}

module.exports = TenantCertificateCanBeNullSchema
