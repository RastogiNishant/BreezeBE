'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTransferPriceToTenantsSchema extends Schema {
  up () {
    this.table('tenants', (table) => {
      // alter table
      table.integer('transfer_budget_min')
      table.integer('transfer_budget_max')
    })
  }

  down () {
    this.table('tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddTransferPriceToTenantsSchema
