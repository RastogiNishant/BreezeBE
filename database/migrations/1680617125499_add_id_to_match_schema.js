'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIdToMatchSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.increments()
    })
  }

  down() {
    this.table('add_id_to_matches', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddIdToMatchSchema
