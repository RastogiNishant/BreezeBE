'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOrderToRoomSchema extends Schema {
  up() {
    this.table('rooms', (table) => {
      // alter table
      table.integer('order').defaultTo(100000)
    })
  }

  down() {
    this.table('add_order_to_rooms', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddOrderToRoomSchema
