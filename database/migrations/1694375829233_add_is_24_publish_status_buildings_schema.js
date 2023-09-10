'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIs24PublishStatusBuildingsSchema extends Schema {
  up() {
    this.table('buildings', (table) => {
      // alter table
      table.integer('is24_publish_status').comment('0-init,1-processed,3-published')
    })
  }

  down() {
    this.table('buildings', (table) => {
      // reverse alternations
      table.dropColumn('is24_publish_status')
    })
  }
}

module.exports = AddIs24PublishStatusBuildingsSchema
