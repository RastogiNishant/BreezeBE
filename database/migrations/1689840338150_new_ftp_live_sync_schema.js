'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class NewFtpLiveSyncSchema extends Schema {
  up() {
    this.create('ftp_live_syncs', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users').unique()
      table.string('company_name').comment('company that own this')
      table.string('email').comment('This is where we send contact requests.')
      table.integer('status').defaultTo(STATUS_ACTIVE).comment('1 - active, 2 - deleted')
    })
  }

  down() {
    this.drop('ftp_live_syncs')
  }
}

module.exports = NewFtpLiveSyncSchema
