'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { TENANT_EMAIL_INVITE, TENANT_SMS_INVITE } = require('../../app/constants')

class AddEmailSmsInvitationToMatchSchema extends Schema {
  up () {
    this.table('matches', (table) => {
      // alter table
      table.integer('inviteToEdit')
      table.text('properties')
      table.decimal('prices').defaultTo(0)
    })
  }

  down () {
    this.table('matches', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddEmailSmsInvitationToMatchSchema
