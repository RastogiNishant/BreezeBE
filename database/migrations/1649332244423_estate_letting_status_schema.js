'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstateLettingStatusSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('letting_status').unsigned()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('letting_status')
    })
  }
}

module.exports = EstateLettingStatusSchema
