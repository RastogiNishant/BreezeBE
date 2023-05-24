'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOrderToOptionsSchema extends Schema {
  up() {
    this.table('options', (table) => {
      // alter table
      table.integer('order').defaultTo(10000)
    })
  }

  down() {
    this.table('options', (table) => {
      // reverse alternations
      table.dropColumn('order')
    })
  }
}

module.exports = AddOrderToOptionsSchema
