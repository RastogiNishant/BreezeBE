'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddInviteInToVisitsSchema extends Schema {
  up () {
    this.table('matches', (table) => {
      // alter table
      table.boolean('inviteIn').defaultTo(false)
    })
  }

  down () {
    this.table('matches', (table) => {
      // reverse alternations
      table.dropColumn('inviteIn')
    })
  }
}

module.exports = AddInviteInToVisitsSchema
