'use strict'

const Schema = use('Schema')

class UsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      table.boolean('notice').defaultTo(true)
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropColumn('notice')
    })
  }
}

module.exports = UsersSchema
