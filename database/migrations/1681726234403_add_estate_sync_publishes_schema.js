'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEstateSyncPublishesSchema extends Schema {
  up() {
    this.create('estate_sync_listings', (table) => {
      table.increments()
      table.string('provider').comment('See ESTATE_SYNC_PUBLISH_PROVIDER...')
      table.integer('estate_id').references('id').inTable('estates').index()
      table.integer('performed_by').references('id').inTable('users').index()
      table.integer('status').comment('See ESTATE_SYNC_PUBLISH_STATUS...')
      table.string('estate_sync_property_id')
      table.string('estate_sync_listing_id')
      table.timestamps()
    })

    table.unique(['provider', 'estate_id'])
  }

  down() {
    this.drop('estate_sync_listings')
  }
}

module.exports = AddEstateSyncPublishesSchema
