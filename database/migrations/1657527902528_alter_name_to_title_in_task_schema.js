'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterNameToTitleInTaskSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      // alter table
      table.dropColumn('name')
      table.string('title', 255)
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterNameToTitleInTaskSchema
