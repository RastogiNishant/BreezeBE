'use strict'

const Schema = use('Schema')

class TenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.date('rent_start', { useTz: false })
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('rent_start')
    })
  }
}

module.exports = TenantSchema
