'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUniqueToUnitCategorySchema extends Schema {
  up() {
    this.table('unit_categories', (table) => {
      // alter table
      table.unique(['build_id', 'name'])
    })
  }

  down() {
    this.table('unit_categories', (table) => {
      // reverse alternations
      table.dropUnique(['build_id', 'name'])
    })
  }
}

module.exports = AddUniqueToUnitCategorySchema
