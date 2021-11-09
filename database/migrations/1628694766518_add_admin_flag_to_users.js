'use strict'

const Schema = use('Schema')

class UsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      table.boolean('is_admin').defaultTo(false)
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropColumn('is_admin')
    })
  }
}

module.exports = UsersSchema
