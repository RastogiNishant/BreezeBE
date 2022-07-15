'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNameToTaskSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      // alter table
      table.string('name', 255)
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
      table.dropColumn('name')
    })
  }
}

module.exports = AddNameToTaskSchema
