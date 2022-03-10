'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PaymentPlanIndexSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.foreign('payment_plan').references('id').on('tenant_payment_plans').onDelete('cascade')      
    })
  }

  down () {
    this.table('payment_plan_indices', (table) => {
      // reverse alternations
    })
  }
}

module.exports = PaymentPlanIndexSchema
