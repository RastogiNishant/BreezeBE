'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Member = use('App/Models/Member')

class HouseholdIsVerifiedToTrueSchema extends Schema {
  async up() {
    await Member.query().whereNull('owner_user_id').update({ is_verified: true })
  }

  down() {}
}

module.exports = HouseholdIsVerifiedToTrueSchema
