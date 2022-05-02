'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeSlotLengthNullable extends Schema {
  up() {
    this.table('time_slots', (table) => {
      table.integer('slot_length').unsigned().nullable().alter()
    })
  }

  down() {
    this.table('time_slots', (table) => {
      table.integer('slot_length').unsigned().notNullable().alter()
    })
  }
}

module.exports = MakeSlotLengthNullable
