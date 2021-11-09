'use strict'

const Schema = use('Schema')

class UsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      table.boolean('approved_landlord').defaultTo(false)
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropColumn('approved_landlord')
    })
  }
}

module.exports = UsersSchema
