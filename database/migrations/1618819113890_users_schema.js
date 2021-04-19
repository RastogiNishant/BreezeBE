'use strict'

const Schema = use('Schema')

class UsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      table.integer('lord_size').unsigned()
      table.boolean('request_full_profile').defaultTo(false)
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropColumn('lord_size')
      table.dropColumn('request_full_profile')
    })
  }
}

module.exports = UsersSchema
