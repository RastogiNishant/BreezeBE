'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCandidateInvitationCountSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.boolean('is_duration_later').defaultTo(false)
      table.integer('min_invite_count').unsigned()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('is_duration_later')
      table.dropColumn('min_invite_count')
    })
  }
}

module.exports = AddCandidateInvitationCountSchema
