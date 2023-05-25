'use strict'

const { PAID_PENDING_STATUS } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreateOrderSchema extends Schema {
  up() {
    this.create('orders', (table) => {
      table.increments()
      table.string('contract_id').index()
      table.integer('user_id').references('id').inTable('users').notNullable().index()
      table
        .integer('status')
        .default(PAID_PENDING_STATUS)
        .notNullable()
        .comment('1: pending, 2: one time paid, 3: all paid for subscription, 4: refunded')
      table.dateTime('date').index()
      table.boolean('livemode').defaultTo(false)
      table.timestamps()
    })
  }

  down() {
    this.drop('orders')
  }
}

module.exports = CreateOrderSchema
