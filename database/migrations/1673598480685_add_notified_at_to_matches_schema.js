'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNotifiedAtToMatchesSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.datetime('notified_at', { useTz: false })
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNotifiedAtToMatchesSchema
