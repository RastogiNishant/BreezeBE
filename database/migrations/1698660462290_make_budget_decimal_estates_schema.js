'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeBudgetDecimalEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.decimal('budget', 10, 4).alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      table.integer('budget').alter()
    })
  }
}

module.exports = MakeBudgetDecimalEstatesSchema
