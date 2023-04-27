'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEstateSyncTargetsSchema extends Schema {
  up() {
    this.create('estate_sync_targets', (table) => {
      table.increments()
      table
        .integer('estate_sync_credential_id')
        .references('id')
        .inTable('estate_sync_credentials')
        .index()
      table.string('publishing_provider').comment('ESTATE_SYNC_PUBLISH_PROVIDER...')
      table.string('estate_sync_target_id')
      table.timestamps()

      table.unique(['estate_sync_credential_id', 'publishing_provider'])
    })
  }

  down() {
    this.drop('estate_sync_targets')
  }
}

module.exports = AddEstateSyncTargetsSchema
