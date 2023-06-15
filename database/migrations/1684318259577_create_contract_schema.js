'use strict'

const { STATUS_ACTIVE, STATUS_DRAFT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreateContractSchema extends Schema {
  up() {
    this.create('contracts', (table) => {
      table.increments()
      table.string('contract_id').index()
      table.string('payment_method').index().comment('paypal, stripe')
      table.integer('user_id').references('id').inTable('users').notNullable().index()
      table
        .integer('status')
        .defaultTo(STATUS_DRAFT)
        .comment('5: progress, 1: active, 6: expired, 2: delete')
      table.dateTime('date').notNullable()
      table.boolean('livemode').defaultTo(false)
      table.unique(['contract_id'])
      table.timestamps()
    })
  }

  down() {
    this.drop('contracts')
  }
}

module.exports = CreateContractSchema
