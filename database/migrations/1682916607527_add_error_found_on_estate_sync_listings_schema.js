'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddErrorFoundOnEstateSyncListingsSchema extends Schema {
  up() {
    this.table('estate_sync_listings', (table) => {
      // alter table
      table.boolean('posting_error').default(false)
      table.boolean('publishing_error').default(false)
      table
        .string('posting_error_message')
        .default(null)
        .comment('the message coming from estateSync')
      table.string('publishing_error_message')
      table.string('publishing_error_type').default(null).comment('could be either: set or delete')
    })
  }

  down() {
    this.table('estate_sync_listings', (table) => {
      // reverse alternations
      table.dropColumn('posting_error')
      table.dropColumn('publishing_error')
      table.dropColumn('posting_error_message')
      table.dropColumn('publishing_error_message')
      table.dropColumn('publishing_error_type')
    })
  }
}

module.exports = AddErrorFoundOnEstateSyncListingsSchema
