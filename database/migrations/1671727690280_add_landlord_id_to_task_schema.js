'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddLandlordIdToTaskSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      // alter table
      table.integer('landlord_id').unsigned().references('id').inTable('users')
      table.index('landlord_id')
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
      table.dropColumn('landlord_id')
      table.dropIndex('landlord_id')
    })
  }
}

module.exports = AddLandlordIdToTaskSchema
