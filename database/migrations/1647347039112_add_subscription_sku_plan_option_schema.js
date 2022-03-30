'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddSubscriptionSkuPlanOptionSchema extends Schema {
  up () {
    this.table('tenant_payment_plans', (table) => {
      // alter table
      table.string('subscription_sku', 255)      
    })
  }

  down () {
    this.table('tenant_payment_plans', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddSubscriptionSkuPlanOptionSchema
