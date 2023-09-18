'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCategoryIdEstateSyncListingSchema extends Schema {
  up() {
    this.table('estate_sync_listings', (table) => {
      table
        .integer('unit_category_id')
        .references('id')
        .inTable('unit_categories')
        .index()
        .nullable()
      table.integer('building_id').references('id').inTable('buildings').index().nullable()
    })
  }

  down() {
    this.table('estate_sync_listings', (table) => {
      // reverse alternations
      table.dropColumn('unit_category_id')
      table.dropColumn('building_id')
    })
  }
}

module.exports = AddCategoryIdEstateSyncListingSchema
