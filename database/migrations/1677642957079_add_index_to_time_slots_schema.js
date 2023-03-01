'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToTimeSlotsSchema extends Schema {
  up() {
    this.table('time_slots', (table) => {
      // alter table
      table.index('estate_id')
    })
  }

  down() {
    this.table('time_slots', (table) => {
      // reverse alternations
      table.dropIndex('estate_id')
    })
  }
}

module.exports = AddIndexToTimeSlotsSchema
