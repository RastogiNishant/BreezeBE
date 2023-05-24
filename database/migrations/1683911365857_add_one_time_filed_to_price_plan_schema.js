'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOneTimeFiledToPricePlanSchema extends Schema {
  up() {
    this.table('price_plans', (table) => {
      // alter table
      table.boolean('one_time_pay').defaultTo(false)
    })
  }

  down() {
    this.table('price_plans', (table) => {
      // reverse alternations
      table.dropColumn('one_time_pay')
    })
  }
}

module.exports = AddOneTimeFiledToPricePlanSchema
