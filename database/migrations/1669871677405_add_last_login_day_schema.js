'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddLastLoginDaySchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.dateTime('last_login', { useTz: false })
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('last_login')
    })
  }
}

module.exports = AddLastLoginDaySchema
