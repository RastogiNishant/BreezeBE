'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddAdditionalFieldsToIncomesSchema extends Schema {
  up() {
    this.table('incomes', (table) => {
      // alter table
      table.string('employeed_address', 250)
      table.string('employeer_phone_number')
      table.date('probation_period')
    })
  }

  down() {
    this.table('incomes', (table) => {
      // reverse alternations
      table.dropColumn('employeed_address')
      table.dropColumn('employeer_phone_number')
      table.dropColumn('probation_period')
    })
  }
}

module.exports = AddAdditionalFieldsToIncomesSchema
