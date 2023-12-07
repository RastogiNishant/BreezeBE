'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemindersInContactRequestsSchema extends Schema {
  up() {
    this.table('estate_sync_contact_requests', (table) => {
      // alter table
      table
        .smallint('reminders_to_convert')
        .defaultTo(0)
        .comment(`The number of reminders sent to prospect`)
      table.datetime('last_reminder').comment(`date time when last reminder was sent`)
    })
  }

  down() {
    this.table('estate_sync_contact_requests', (table) => {
      // reverse alternations
      table.dropColumn('reminders_to_convert')
      table.dropColumn('last_reminder')
    })
  }
}

module.exports = RemindersInContactRequestsSchema
