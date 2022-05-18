'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStartEndDateToVisitsSchema extends Schema {
  up() {
    this.table('visits', (table) => {
      // alter table
      table.datetime('start_date', { useTz: false })
      table.datetime('end_date', { useTz: false })
    })
  }

  down() {
    this.table('visits', (table) => {
      // reverse alternations
      table.dropColumn('start_date')
      table.dropColumn('end_date')
    })
  }
}

module.exports = AddStartEndDateToVisitsSchema
