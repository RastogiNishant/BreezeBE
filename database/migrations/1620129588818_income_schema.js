'use strict'

const Schema = use('Schema')

class IncomeSchema extends Schema {
  up() {
    this.create('incomes', (table) => {
      table.increments()
      table.string('url', 254)
      table.integer('member_id').unsigned().references('id').inTable('members').onDelete('cascade')
      table.string('disk', 10)
    })
  }

  down() {
    this.drop('incomes')
  }
}

module.exports = IncomeSchema
