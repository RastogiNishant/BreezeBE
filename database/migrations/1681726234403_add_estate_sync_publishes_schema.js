'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEstateSyncPublishesSchema extends Schema {
  up() {
    this.create('estate_sync_listings', (table) => {
      table.increments()
      table.string('provider').notNullable().comment('See ESTATE_SYNC_PUBLISH_PROVIDER...')
      table.integer('estate_id').notNullable().references('id').inTable('estates').index()
      table.integer('performed_by').references('id').inTable('users').index()
      table.integer('status').comment('1 - means this is posted to estate sync, 2 - means deleted')
      table.string('estate_sync_property_id').index()
      table
        .string('estate_sync_listing_id')
        .index()
        .comment('if set means that this is published to provider.')
      table.string('publish_url')
      table.timestamps()

      table.unique(['provider', 'estate_id'])
    })
  }

  down() {
    this.drop('estate_sync_listings')
  }
}

module.exports = AddEstateSyncPublishesSchema
