'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusAtToMatchesSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.dateTime('status_at')
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
      table.dropColumn('status_at')
    })
  }
}

module.exports = AddStatusAtToMatchesSchema
