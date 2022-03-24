'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserAgreementAcceptanceTracking extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.datetime('agreements_acceptance_date', { useTz: false }).nullable()
      table.datetime('terms_acceptance_date', { useTz: false }).nullable()
      table.string('agreements_acceptance_lang').nullable()
      table.string('terms_acceptance_lang').nullable()
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = UserAgreementAcceptanceTracking
