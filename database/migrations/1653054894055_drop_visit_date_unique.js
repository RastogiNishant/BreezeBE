'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DropVisitDateUnique extends Schema {
  up() {
    this.table('visits', (table) => {
      // alter table
      table.dropUnique(['estate_id', 'date'])
    })
  }

  down() {
    this.table('visits', (table) => {
      // reverse alternations
      table.unique(['estate_id', 'date'])
    })
  }
}

module.exports = DropVisitDateUnique
