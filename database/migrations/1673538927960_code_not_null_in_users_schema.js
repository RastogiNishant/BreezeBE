'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CodeNotNullInUsersSchema extends Schema {
  up() {
    this.alter('users', (table) => {
      // alter table
      table.string('code').notNullable().alter()
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = CodeNotNullInUsersSchema
