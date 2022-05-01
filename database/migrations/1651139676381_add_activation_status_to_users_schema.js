'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddActivationStatusToUsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.integer('activation_status').nullable().default(null).comment('activation status')
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('activation_status')
    })
  }
}

module.exports = AddActivationStatusToUsersSchema
