'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFrontendUsedToUsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.string('frontend_used')
    })
  }

  down() {
    this.table('add_frontend_used_to_users', (table) => {
      // reverse alternations
      table.dropColumn('frontend_used')
    })
  }
}

module.exports = AddFrontendUsedToUsersSchema
