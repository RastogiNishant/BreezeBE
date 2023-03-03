'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToEstateCurrentTenantsSchema extends Schema {
  up() {
    this.table('estate_current_tenants', (table) => {
      // alter table
      table.index('estate_id')
      table.index('user_id')
      table.index(['estate_id', 'user_id'])
      table.index('email')
    })
  }

  down() {
    this.table('estate_current_tenants', (table) => {
      // reverse alternations
      table.dropIndex('estate_id')
      table.dropIndex('user_id')
      table.dropIndex('email')
      table.dropIndex(['estate_id', 'user_id'])
    })
  }
}

module.exports = AddIndexToEstateCurrentTenantsSchema
