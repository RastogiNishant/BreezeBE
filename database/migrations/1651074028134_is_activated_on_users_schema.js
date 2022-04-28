'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IsActivatedOnUsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table
        .boolean('is_activated')
        .nullable()
        .comment(
          'whether this user is activated or not. Admins are the ones who can activate users'
        )
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('is_activated')
    })
  }
}

module.exports = IsActivatedOnUsersSchema
