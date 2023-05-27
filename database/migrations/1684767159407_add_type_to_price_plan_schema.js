'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTypeToPricePlanSchema extends Schema {
  up() {
    this.table('price_plans', (table) => {
      // alter table
      table.integer('type')
    })
  }

  down() {
    this.table('price_plans', (table) => {
      // reverse alternations
      table.dropColumn('type')
    })
  }
}

module.exports = AddTypeToPricePlanSchema
