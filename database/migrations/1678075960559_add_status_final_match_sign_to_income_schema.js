'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusFinalMatchSignToIncomeSchema extends Schema {
  up() {
    this.table('incomes', (table) => {
      // alter table
      table.integer('status').defaultTo(STATUS_ACTIVE)
      table.boolean('is_final').defaultTo(false)
    })
  }

  down() {
    this.table('incomes', (table) => {
      // reverse alternations
      table.dropColumn('status')
      table.dropColumn('is_final')
    })
  }
}

module.exports = AddStatusFinalMatchSignToIncomeSchema
