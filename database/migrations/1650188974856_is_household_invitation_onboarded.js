'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserOnboardingStatus extends Schema {
  up() {
    this.table('users', (table) => {
      // Only specific users (household) will be not onboarded as default
      table.boolean('is_household_invitation_onboarded').defaultTo(true)
    })
  }
  down() {
    this.table('users', (table) => {
      table.dropColumn('is_household_invitation_onboarded')
    })
  }
}

module.exports = UserOnboardingStatus
