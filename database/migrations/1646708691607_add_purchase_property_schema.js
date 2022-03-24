'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPurchasePropertySchema extends Schema {
  up () {
    this.table('user_premium_plans', (table) => {
      // alter table
      table.string('app', 255)
      table.string('environment', 255)
      table.text('latestReceipt')      
      table.string('productId', 255)
      table.string('transactionId', 255)
      table.boolean('isCancelled').defaultTo(false)
      table.date('startDate')
      table.date('endDate')
      table.json('validationResponse')
      table.boolean('fake').defaultTo(true)
    })
  }

  down () {
    this.table('user_premium_plans', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddPurchasePropertySchema