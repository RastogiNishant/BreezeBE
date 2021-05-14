'use strict'

const Schema = use('Schema')

class TenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.string('address', 255)
      table.decimal('income', 10, 2)
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('address')
      table.dropColumn('income')
    })
  }
}

module.exports = TenantSchema
