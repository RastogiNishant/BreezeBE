'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPropertyIdToUnitCategorySchema extends Schema {
  up() {
    this.table('unit_categories', (table) => {
      // alter table
      table.string('property_id')
    })
  }

  down() {
    this.table('unit_categories', (table) => {
      // reverse alternations
      table.dropColumn('property_id')
    })
  }
}

module.exports = AddPropertyIdToUnitCategorySchema
