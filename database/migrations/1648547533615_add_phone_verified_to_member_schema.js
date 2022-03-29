'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPhoneVerifiedToMemberSchema extends Schema {
  up () {
    this.table('members', (table) => {
      // alter table
      table.boolean('phone_verified').defaultTo(false)            
    })
  }

  down () {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('phone_verified')
    })
  }
}

module.exports = AddPhoneVerifiedToMemberSchema
