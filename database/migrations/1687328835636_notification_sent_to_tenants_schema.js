'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class NotificationSentToTenantsSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.specificType('notify_sent', 'INT[]').comment('what type of notification sent')
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
      table.dropColumn('notify_sent')
    })
  }
}

module.exports = NotificationSentToTenantsSchema
