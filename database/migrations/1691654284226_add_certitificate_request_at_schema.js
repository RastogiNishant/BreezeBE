'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCertitificateRequestAtSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.date('request_certificate_at')
      table.integer('request_certificate_city_id')
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
      table.dropColumn('request_certificate_at')
      table.dropColumn('request_certificate_city_id')
    })
  }
}

module.exports = AddCertitificateRequestAtSchema
