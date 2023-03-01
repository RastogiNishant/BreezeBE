'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToAdminSchema extends Schema {
  up() {
    this.table('dislikes', (table) => {
      // alter table
      table.index('user_id')
      table.index('estate_id')
      table.index(['user_id', 'estate_id'])
    })
  }

  down() {
    this.table('dislikes', (table) => {
      // reverse alternations
      table.dropIndex('user_id')
      table.dropIndex('estate_id')
      table.dropIndex(['user_id', 'estate_id'])
    })
  }
}

module.exports = AddIndexToAdminSchema
