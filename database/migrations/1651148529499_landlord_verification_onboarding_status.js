'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class LandlordVerificationOnboardingStatus extends Schema {
  up() {
    this.table('users', (table) => {
      // Only specific users (household) will be not onboarded as default
      table.boolean('is_landlord_verification_onboarded').defaultTo(false)
    })
  }
  down() {
    this.table('users', (table) => {
      table.dropColumn('is_landlord_verification_onboarded')
    })
  }
}

module.exports = LandlordVerificationOnboardingStatus
