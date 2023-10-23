'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddContractDurationToIncomesSchema extends Schema {
  up() {
    this.table('incomes', (table) => {
      // alter table
      table.integer('income_contract_end')
    })
  }

  down() {
    this.table('incomes', (table) => {
      // reverse alternations
      table.dropColumn('income_contract_end')
    })
  }
}

module.exports = AddContractDurationToIncomesSchema
