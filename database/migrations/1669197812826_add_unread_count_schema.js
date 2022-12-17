'use strict'

const { ROLE_USER, ROLE_LANDLORD } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUnreadCountSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      // alter table
      table.integer('unread_count').unsigned().defaultTo(0)
      table.integer('unread_role').unsigned().nullable()
      table.integer('first_not_read_chat_id').unsigned().nullable()
      table.index('unread_role')
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
      table.dropColumn('unread_count')
      table.dropIndex('unread_role')
      table.dropColumn('unread_role')
    })
  }
}

module.exports = AddUnreadCountSchema
