'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDescriptionToTaskSchema extends Schema {
  up () {
    this.table('tasks', (table) => {
      // alter table
      table.text('description')
    })
  }

  down () {
    this.table('tasks', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddDescriptionToTaskSchema
