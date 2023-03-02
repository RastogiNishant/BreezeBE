'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToVisitsSchema extends Schema {
  up() {
    this.table('visits', (table) => {
      // alter table
      table.index('estate_id')
      table.index(['estate_id', 'user_id'])
    })
  }

  down() {
    this.table('visits', (table) => {
      // reverse alternations
      table.dropIndex('estate_id')
      table.dropIndex(['estate_id', 'user_id'])
    })
  }
}

module.exports = AddIndexToVisitsSchema
