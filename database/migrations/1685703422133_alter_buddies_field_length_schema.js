'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterBuddiesFieldLengthSchema extends Schema {
  up() {
    this.alter('buddies', (table) => {
      // alter table
      table.string('name', 100).alter()
      table.string('phone', 100).alter()
      table.string('email', 100).alter()
    })
  }

  down() {
    this.table('buddies', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterBuddiesFieldLengthSchema
