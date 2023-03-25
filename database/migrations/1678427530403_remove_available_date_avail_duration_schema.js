'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemoveAvailableDateAvailDurationSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.dropColumn('available_date')
      table.dropColumn('avail_duration')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.date('available_date', { useTz: false })
      table.integer('avail_duration').unsigned()
    })
  }
}

module.exports = RemoveAvailableDateAvailDurationSchema
