'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddMixedUseDetailToTenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.text('mixed_use_type_detail')
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
      table.dropColumn('mixed_use_type_detail')
    })
  }
}

module.exports = AddMixedUseDetailToTenantSchema
