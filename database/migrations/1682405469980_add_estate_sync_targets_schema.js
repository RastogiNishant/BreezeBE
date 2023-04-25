'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEstateSyncTargetsSchema extends Schema {
  up() {
    this.create('estate_sync_targets', (table) => {
      table.increments()
      table
        .integer('estate_sync_credentials_id')
        .references('id')
        .inTable('estate_sync_credentials')
      table.string('publishing_provider').comment('ESTATE_SYNC_PUBLISH_PROVIDER...')
      table.string('estate_sync_listing_id')
      table.timestamps()
    })
  }

  down() {
    this.drop('estate_sync_targets')
  }
}

module.exports = AddEstateSyncTargetsSchema
