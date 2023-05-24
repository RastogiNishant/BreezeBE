'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDueDateToTasksSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      table.date('due_date')
    })
  }

  down() {
    this.table('tasks', (table) => {
      table.dropColumn('due_date')
    })
  }
}

module.exports = AddDueDateToTasksSchema
