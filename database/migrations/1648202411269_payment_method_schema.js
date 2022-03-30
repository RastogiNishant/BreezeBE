'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PaymentMethodSchema extends Schema {
  up () {
    this.create('payment_methods', (table) => {
      table.increments()
      table.timestamps()
      table.integer('user_id').unsigned().references('id').inTable('users').notNullable()
      table.string('payment_method_type', 16).notNullable()
      table.boolean('is_primary').defaultTo(false)
      table.json('info')
    })
  }

  down () {
    this.drop('payment_methods')
  }
}

module.exports = PaymentMethodSchema
