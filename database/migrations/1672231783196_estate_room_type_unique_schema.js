'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AdjustRoomUniqueSchema extends Schema {
  up() {
    this.table('rooms', (table) => {
      table.unique(['estate_id', 'type', 'name'])
    })
  }

  down() {
    this.table('rooms', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AdjustRoomUniqueSchema
