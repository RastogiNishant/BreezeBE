'use strict'

const Schema = use('Schema')

class IncomeSchema extends Schema {
  up() {
    this.table('incomes', (table) => {
      table.integer('work_exp').unsigned()
    })
  }

  down() {
    this.table('incomes', (table) => {
      table.dropColumn('work_exp')
    })
  }
}

module.exports = IncomeSchema
