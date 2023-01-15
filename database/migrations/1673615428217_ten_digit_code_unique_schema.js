'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TenDigitCodeUniqueSchema extends Schema {
  up() {
    this.alter('users', (table) => {
      // alter table
      table.string('code').unique().alter()
      table.dropUnique(['id', 'code'])
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = TenDigitCodeUniqueSchema
