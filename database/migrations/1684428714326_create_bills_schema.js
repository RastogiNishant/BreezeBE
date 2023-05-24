'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreateBillsSchema extends Schema {
  up() {
    this.create('bills', (table) => {
      table.increments()
      table.string('invoice_id').notNullable().index()
      table.string('bill_id').notNullable().index()
      table.string('price_id').notNullable().index()
      table
        .integer('status')
        .notNullable()
        .index()
        .comment('PAID_PENDING_STATUS-1: has to pay, PAID_COMPLETE_STATUS-3: paid')
      table.timestamps()
    })
  }

  down() {
    this.drop('bills')
  }
}

module.exports = CreateBillsSchema
