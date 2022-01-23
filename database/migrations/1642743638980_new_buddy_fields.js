'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class NewBuddyFields extends Schema {
  up() {
    this.table('buddies', (table) => {
      // alter table
      table.integer('status').unsigned()
      table.integer('tenant_id').unsigned().references('id').inTable('users')
    })
  }

  down() {
    this.table('buddies', (table) => {
      // reverse alternations
      table.dropColumn('status')
      table.dropColumn('tenant_id')
    })
  }
}

module.exports = NewBuddyFields
