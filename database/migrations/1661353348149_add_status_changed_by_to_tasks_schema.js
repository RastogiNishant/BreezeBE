'use strict'

const { ROLE_LANDLORD } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusChangedByToTasksSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      // alter table
      table
        .integer('status_changed_by')
        .defaultTo(ROLE_LANDLORD)
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddStatusChangedByToTasksSchema
