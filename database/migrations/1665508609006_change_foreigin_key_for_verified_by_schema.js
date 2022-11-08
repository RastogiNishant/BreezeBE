'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ChangeForeiginKeyForVerifiedBySchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.dropForeign(['verified_by'])
      //table.foreign('verified_by').references('id').on('admins').onDelete('SET NULL')
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ChangeForeiginKeyForVerifiedBySchema
