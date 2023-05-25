'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class TasksTenantIdCanBeNullSchema extends Schema {
  async up() {
    await Database.raw(`ALTER TABLE tasks ALTER COLUMN tenant_id DROP NOT NULL;`)
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
    })
  }
}

module.exports = TasksTenantIdCanBeNullSchema
