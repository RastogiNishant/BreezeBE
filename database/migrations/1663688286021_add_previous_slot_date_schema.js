'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPreviousSlotDateSchema extends Schema {
  up() {
    this.table('time_slots', (table) => {
      // alter table
      table.datetime('prev_start_at', { useTz: false })
      table.datetime('prev_end_at', { useTz: false })
    })
  }

  down() {
    this.table('time_slots', (table) => {
      // reverse alternations
      table.dropColumn('prev_start_at')
      table.dropColumn('prev_end_at')
    })
  }
}

module.exports = AddPreviousSlotDateSchema
