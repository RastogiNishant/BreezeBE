'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDeletedToMatchSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.boolean('deleted').defaultTo(false)
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
      table.dropColumn('deleted')
    })
  }
}

module.exports = AddDeletedToMatchSchema
