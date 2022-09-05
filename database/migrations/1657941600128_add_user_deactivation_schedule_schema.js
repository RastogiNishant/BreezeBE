'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUserDeactivationScheduleSchema extends Schema {
  up() {
    this.create('user_deactivation_schedules', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users').notNullable().unique()
      table.dateTime('deactivate_schedule', { useTz: true }).notNullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('user_deactivation_schedules')
  }
}

module.exports = AddUserDeactivationScheduleSchema
