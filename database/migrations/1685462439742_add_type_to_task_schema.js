'use strict'

const { TASK_COMMON_TYPE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTypeToTaskSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      // alter table
      table.integer('type').defaultTo(TASK_COMMON_TYPE)
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
      table.dropColumn('type')
    })
  }
}

module.exports = AddTypeToTaskSchema
