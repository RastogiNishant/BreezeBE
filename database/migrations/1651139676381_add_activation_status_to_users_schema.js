'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const {
  USER_ACTIVATION_STATUS_NOT_ACTIVATED,
  USER_ACTIVATION_STATUS_ACTIVATED,
  USER_ACTIVATION_STATUS_DEACTIVATED,
} = require('../../app/constants')

class AddActivationStatusToUsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table
        .enum('activation_status', [
          USER_ACTIVATION_STATUS_NOT_ACTIVATED,
          USER_ACTIVATION_STATUS_ACTIVATED,
          USER_ACTIVATION_STATUS_DEACTIVATED,
        ])
        .comment('activation status')
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
