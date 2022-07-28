'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTranferBudgetToEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.boolean('is_new_tenenant_transfer').defaultTo(false)
      table.integer('transfer_budget')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddTranferBudgetToEstateSchema
