'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddModeToPlansSchema extends Schema {
  up() {
    this.table('price_plans', (table) => {
      // alter table
      table.dropColumn('one_time_pay')
      table.integer('mode')
    })
  }

  down() {
    this.table('price_plans', (table) => {
      // reverse alternations
      table.boolean('one_time_pay').defaultTo(false)
      table.dropColumn('mode')
    })
  }
}

module.exports = AddModeToPlansSchema
