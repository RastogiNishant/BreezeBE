'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddResidencyDurationToTenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.integer('residency_duration')
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddResidencyDurationToTenantSchema
