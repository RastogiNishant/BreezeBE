'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IndexUserFirstnameLastnameSchema extends Schema {
  up() {
    this.table('users', (table) => {
      table.index('firstname')
      table.index('secondname')
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
      table.dropIndex('firstname')
      table.dropIndex('secondname')
    })
  }
}

module.exports = IndexUserFirstnameLastnameSchema
