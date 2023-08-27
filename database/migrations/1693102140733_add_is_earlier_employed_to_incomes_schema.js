'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIsEarlierEmployedToIncomesSchema extends Schema {
  up() {
    this.table('incomes', (table) => {
      // alter table
      table.boolean('is_earlier_employeed').defaultTo(false)
    })
  }

  down() {
    this.table('incomes', (table) => {
      // reverse alternations
      table.dropColumn('is_earlier_employeed')
    })
  }
}

module.exports = AddIsEarlierEmployedToIncomesSchema
