'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddLiveModeToPaymentAccountSchema extends Schema {
  up() {
    this.table('payment_accounts', (table) => {
      // alter table
      table.boolean('livemode').defaultTo(false)
    })
  }

  down() {
    this.table('payment_accounts', (table) => {
      // reverse alternations
      table.dropColumn('livemode')
    })
  }
}

module.exports = AddLiveModeToPaymentAccountSchema
