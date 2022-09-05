'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TenantIncreaseAddressLengthSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.string('coord_raw', 30).alter()
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = TenantIncreaseAddressLengthSchema
