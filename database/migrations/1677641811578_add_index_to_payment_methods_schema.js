'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToPaymentMethodsSchema extends Schema {
  up() {
    this.table('payment_methods', (table) => {
      // alter table
      table.index('user_id')
      table.index(['user_id', 'payment_method_type'])
    })
  }

  down() {
    this.table('payment_methods', (table) => {
      // reverse alternations
      table.dropIndex('user_id')
      table.dropIndex(['user_id', 'payment_method_type'])
    })
  }
}

module.exports = AddIndexToPaymentMethodsSchema
