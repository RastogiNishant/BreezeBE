'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTenantIndexPointIdSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.index('point_id')
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddTenantIndexPointIdSchema
