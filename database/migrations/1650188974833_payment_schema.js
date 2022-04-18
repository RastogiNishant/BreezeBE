'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PaymentSchema extends Schema {
  up () {
    this.alter('payments', (table) => {
      // alter table
      table.integer('plan_id'); 
      table.json('plan_response')
    })
  }

  down () {
    this.alter('payments', (table) => {
      // reverse alternations
      table.json('plan_response')
      table.dropColumn('plan_id')
    })
  }
}

module.exports = PaymentSchema
