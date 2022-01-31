'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserUnreadNotificationsCount extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.integer('unread_notification_count').defaultTo(0).alter()
    })
  }
}

module.exports = UserUnreadNotificationsCount
