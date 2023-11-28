'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTypeToUserDeactivationSchedulesSchema extends Schema {
  up() {
    this.table('user_deactivation_schedules', (table) => {
      table.integer('type').comment('1-deactivate, 2-delete')
    })
  }

  down() {
    this.table('user_deactivation_schedules', (table) => {
      // reverse alternations
      table.dropColumn('type')
    })
  }
}

module.exports = AddTypeToUserDeactivationSchedulesSchema
