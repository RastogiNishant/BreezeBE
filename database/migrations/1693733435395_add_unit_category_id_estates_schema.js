'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUnitCategoryIdEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table
        .integer('unit_category_id')
        .unsigned()
        .references('id')
        .inTable('unit_categories')
        .index()
    })
  }

  down() {
    this.table('add_unit_category_id_estates', (table) => {
      // reverse alternations
      table.dropColumn('unit_category_id')
    })
  }
}

module.exports = AddUnitCategoryIdEstatesSchema
