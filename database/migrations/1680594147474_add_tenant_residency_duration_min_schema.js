'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTenantResidencyDurationMinSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.integer('residency_duration_min')
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
      table.dropColumn('residency_duration_min')
    })
  }
}

module.exports = AddTenantResidencyDurationMinSchema
