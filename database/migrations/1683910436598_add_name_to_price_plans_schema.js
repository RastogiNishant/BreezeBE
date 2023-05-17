'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterPricePlansSchema extends Schema {
  up() {
    this.table('price_plans', (table) => {
      // alter table
      table.string('name')
    })
  }

  down() {
    this.table('price_plans', (table) => {
      // reverse alternations
      table.dropColumn('name')
    })
  }
}

module.exports = AlterPricePlansSchema
