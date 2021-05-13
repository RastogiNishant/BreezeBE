'use strict'

const Schema = use('Schema')

class TenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.integer('point_id').unsigned().references('id').inTable('points')
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('point_id')
    })
  }
}

module.exports = TenantSchema
