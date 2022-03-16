'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PaymentSchema extends Schema {
  up () {
    this.create('payments', (table) => {
      table.increments()
      table.timestamps()
      table.integer('user_id').unsigned().references('id').inTable('users').notNullable()
      table.string('payment_method', 16).notNullable()
      table.string('transaction_id', 254).notNullable()
      table.string('amount', 32).notNullable()
      table.string('lettings', 16).notNullable()
      table.json('payment_method_response')
    })
  }

  down () {
    this.drop('payments')
  }
}

module.exports = PaymentSchema
