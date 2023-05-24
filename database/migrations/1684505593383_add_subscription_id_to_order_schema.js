'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddSubscriptionIdToOrderSchema extends Schema {
  up() {
    this.table('orders', (table) => {
      // alter table
      table.dropColumn('contract_id')
    })
  }

  down() {
    this.table('orders', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddSubscriptionIdToOrderSchema
