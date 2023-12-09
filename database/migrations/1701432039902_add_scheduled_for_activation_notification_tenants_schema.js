'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddScheduledForActivationNotificationTenantsSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table
        .boolean('scheduled_for_activation_notification')
        .defaultTo(false)
        .comment(`true - when queued for activation notification, false -otherwise`)
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('scheduled_for_activation_notification')
    })
  }
}

module.exports = AddScheduledForActivationNotificationTenantsSchema
