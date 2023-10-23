'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddSkipTimeslotsToEstate extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.boolean('skip_timeslots', 255).defaultTo(false)
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('skip_timeslots')
    })
  }
}

module.exports = AddSkipTimeslotsToEstate
