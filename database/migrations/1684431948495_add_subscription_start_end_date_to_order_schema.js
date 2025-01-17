'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddSubscriptionStartEndDateToOrderSchema extends Schema {
  up() {
    this.table('orders', (table) => {
      // alter table
      table.date('start_at').index()
      table.date('end_at').index()
      table.string('subscription_id').index()
      table.string('invoice_id').index()
      table.unique(['invoice_id'])
    })
  }

  down() {
    this.table('orders', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddSubscriptionStartEndDateToOrderSchema
