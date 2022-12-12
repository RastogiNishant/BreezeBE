'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RoomsNumberToDecimalSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.decimal('rooms_number', 3, 1).alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.integer('rooms_number').alter()
    })
  }
}

module.exports = RoomsNumberToDecimalSchema
