'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserOnboardingStatus extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.boolean('is_onboarded').defaultTo(false)
    })
  }
}

module.exports = UserOnboardingStatus
