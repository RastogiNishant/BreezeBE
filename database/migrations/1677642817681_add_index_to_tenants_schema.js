'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToTenantsSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.index('user_id')
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
      table.dropIndex('user_id')
    })
  }
}

module.exports = AddIndexToTenantsSchema
