'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TenantResidentMinMaxDurationSchema extends Schema {
  up() {
    this.alter('tenants', (table) => {
      // alter table
      table.renameColumn('residency_duration', 'residency_duration_max')
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
      table.renameColumn('residency_duration_max', 'residency_duration')
    })
  }
}

module.exports = TenantResidentMinMaxDurationSchema
