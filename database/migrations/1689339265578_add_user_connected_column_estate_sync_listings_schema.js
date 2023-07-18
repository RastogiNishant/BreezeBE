'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUserConnectedColumnEstateSyncListingsSchema extends Schema {
  up() {
    this.table('estate_sync_listings', (table) => {
      // alter table
      table
        .boolean('user_connected')
        .defaultTo(false)
        .comment(`when true, used user's marketplace account when he published.`)
    })
  }

  down() {
    this.table('estate_sync_listings', (table) => {
      // reverse alternations
      table.dropColumn('user_connected')
    })
  }
}

module.exports = AddUserConnectedColumnEstateSyncListingsSchema
