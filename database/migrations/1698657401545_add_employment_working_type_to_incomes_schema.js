'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEmploymentWorkingTypeToIncomesSchema extends Schema {
  up () {
    this.table('incomes', (table) => {
      table.string('employment_working_type')
    })
  }

  down () {
    this.table('incomes', (table) => {
      table.dropColumn('employment_working_type')
    })
  }
}

module.exports = AddEmploymentWorkingTypeToIncomesSchema
