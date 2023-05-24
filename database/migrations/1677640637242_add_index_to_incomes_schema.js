'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToIncomesSchema extends Schema {
  up() {
    this.table('incomes', (table) => {
      // alter table
      table.index('member_id')
      table.index(['member_id', 'income_type'])
      table.index('income_type')
    })
  }

  down() {
    this.table('incomes', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddIndexToIncomesSchema
