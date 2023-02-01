'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DigitCodeToUsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.string('code')
      table.unique(['id', 'code'])
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = DigitCodeToUsersSchema
