'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToNoticesSchema extends Schema {
  up() {
    this.table('notices', (table) => {
      // alter table
      table.index(['user_id', 'type'])
      table.index(['user_id', 'estate_id'])
    })
  }

  down() {
    this.table('notices', (table) => {
      // reverse alternations
      table.dropIndex(['user_id', 'type'])
      table.dropIndex(['user_id', 'estate_id'])
    })
  }
}

module.exports = AddIndexToNoticesSchema
