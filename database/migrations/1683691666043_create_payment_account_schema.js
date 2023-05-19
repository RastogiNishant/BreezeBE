'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreatePaymentAccountSchema extends Schema {
  up() {
    this.create('payment_accounts', (table) => {
      table.increments()
      table.integer('user_id').references('id').inTable('users').index()
      table.string('payment_method').index().comment('STRIPE, PAYPAL')
      table.string('account_id').index()
      table.dateTime('date').comment('when it is created from payment gateway')
      table.integer('status').defaultTo(STATUS_ACTIVE).notNullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('create_payment_accounts')
  }
}

module.exports = CreatePaymentAccountSchema
