'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToFiles2Schema extends Schema {
  up() {
    this.table('files', (table) => {
      // alter table
      table.index('estate_id')
    })
  }

  down() {
    this.table('files', (table) => {
      // reverse alternations
      table.dropIndex('estate_id')
    })
  }
}

module.exports = AddIndexToFiles2Schema
