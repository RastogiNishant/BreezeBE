'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddKnockDateToMatchSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.datetime('knocked_at', { useTz: false })
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
      table.dropColumn('knocked_at')
    })
  }
}

module.exports = AddKnockDateToMatchSchema
