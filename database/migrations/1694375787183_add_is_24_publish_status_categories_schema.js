'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIs24PublishStatusCategoriesSchema extends Schema {
  up() {
    this.table('unit_categories', (table) => {
      // alter table
      table.integer('is24_publish_status').comment('0-init,1-processed,3-published')
    })
  }

  down() {
    this.table('unit_categories', (table) => {
      // reverse alternations
      table.dropColumn('is24_publish_status')
    })
  }
}

module.exports = AddIs24PublishStatusCategoriesSchema
