'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UnitCategorySchema extends Schema {
  up() {
    this.create('unit_categories', (table) => {
      table.increments()
      table.integer('build_id').unsigned().references('id').inTable('buildings').index()
      table.string('name')
      table.string('rooms')
      table.string('area')
      table.string('rent')
      table.string('income_level')
      table.string('household_size')
      table.timestamps()
    })
  }

  down() {
    this.drop('unit_categories')
  }
}

module.exports = UnitCategorySchema
