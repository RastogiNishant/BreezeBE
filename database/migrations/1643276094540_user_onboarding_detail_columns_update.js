'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserOnboardingDetailColumns extends Schema {
  up() {
    this.table('users', (table) => {
      table.boolean('is_dashboard_onboarded').defaultTo(false)
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropColumn('is_dashboard_onboarded')
    })
  }
}

module.exports = UserOnboardingDetailColumns
