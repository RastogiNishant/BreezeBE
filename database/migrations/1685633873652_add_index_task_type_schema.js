'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexTaskTypeSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      // alter table
      table.index('type')
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
      table.dropIndex('type')
    })
  }
}

module.exports = AddIndexTaskTypeSchema
