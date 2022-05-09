'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeCharLength100Schema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.string('coord_raw', 100).alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.string('coord_raw', 25).alter()
    })
  }
}

module.exports = MakeCharLength100Schema
