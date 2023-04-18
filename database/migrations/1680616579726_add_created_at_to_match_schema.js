'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AddCreatedAtToMatchSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
      table.dropColumn('created_at')
    })
  }
}

module.exports = AddCreatedAtToMatchSchema
