'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNotifySentToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.specificType('notify_sent', 'INT[]').comment('what type of notification sent')
    })
  }

  down() {
    this.table('add_notify_sent_to_estates', (table) => {
      // reverse alternations
      table.dropColumn('notify_sent')
    })
  }
}

module.exports = AddNotifySentToEstatesSchema
