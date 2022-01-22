'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const {
  STATUS_EMAIL_VERIFY,
  STATUS_ACTIVE
} = require('../../app/constants')

class UserStatusDefaultChangeSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.integer('status').defaultTo(STATUS_EMAIL_VERIFY).alter()
    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
      table.integer('status').defaultTo(STATUS_ACTIVE).alter()
    })
  }
}

module.exports = UserStatusDefaultChangeSchema
