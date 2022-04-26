'use strict'

const Schema = use('Schema')

class TenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.dropColumn('arrest_warranty')
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.integer('arrest_warranty').unsigned().defaultTo(null).alter()
    })
  }
}

module.exports = TenantSchema
