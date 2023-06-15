'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class OrderUserIdCanBeNullSchema extends Schema {
  up() {
    this.alter('orders', (table) => {
      // alter table
      table.dropColumn('user_id')
    })
  }

  down() {
    this.table('orders', (table) => {
      // reverse alternations
    })
  }
}

module.exports = OrderUserIdCanBeNullSchema
