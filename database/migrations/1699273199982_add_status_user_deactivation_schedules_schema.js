'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusUserDeactivationSchedulesSchema extends Schema {
  up() {
    this.table('user_deactivation_schedules', (table) => {
      table.dropUnique('user_id')
      table.integer('status').comment('1-active, 2-deleted')
    })
  }

  down() {
    this.table('user_deactivation_schedules', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddStatusUserDeactivationSchedulesSchema
