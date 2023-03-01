'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToLikesSchema extends Schema {
  up() {
    this.table('likes', (table) => {
      // alter table
      table.index('user_id')
      table.index('estate_id')
      table.index(['user_id', 'estate_id'])
    })
  }

  down() {
    this.table('likes', (table) => {
      // reverse alternations
      table.dropIndex('user_id')
      table.dropIndex('estate_id')
      table.dropIndex(['user_id', 'estate_id'])
    })
  }
}

module.exports = AddIndexToLikesSchema
