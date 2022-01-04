'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { MONTHLY_PAYMENT, YEARLY_PAYMENT } = require('../../app/constants')

class AddUsersPaymentFieldsSchema extends Schema {
  up () {
    this.table('users', (table) => {
      table.enum('payment_plan', [MONTHLY_PAYMENT, YEARLY_PAYMENT])
      table.boolean('is_premium').defaultTo(false)
    })
  }

  down () {
    this.table('users', (table) => {
      table.dropColumn('payment_plan')
      table.dropColumn('is_premium')
    })
  }
}

module.exports = AddUsersPaymentFieldsSchema
