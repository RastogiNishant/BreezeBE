'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserOnboardingDetailColumns extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.boolean('is_profile_onboarded').defaultTo(false)
      table.boolean('is_dashboard_onboarded').defaultTo(false)
      table.boolean('is_selection_onboarded').defaultTo(false)
    })
  }
}

module.exports = UserOnboardingDetailColumns
