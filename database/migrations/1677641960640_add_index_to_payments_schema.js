'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToPaymentsSchema extends Schema {
  up() {
    this.table('payments', (table) => {
      // alter table
      table.index('user_id')
      table.index(['user_id', 'plan_id'])
      table.index(['user_id', 'payment_method'])
    })
  }

  down() {
    this.table('payments', (table) => {
      // reverse alternations
      table.dropIndex('user_id')
      table.dropIndex(['user_id', 'plan_id'])
      table.dropIndex(['user_id', 'payment_method'])

    })
  }
}

module.exports = AddIndexToPaymentsSchema
