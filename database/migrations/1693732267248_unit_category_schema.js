'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UnitCategorySchema extends Schema {
  up() {
    this.create('unit_categories', (table) => {
      table.increments()
      table.integer('building_id').unsigned().references('id').inTable('buildings').index()
      table.string('name')
      table.integer('rooms')
      table.integer('area_min')
      table.integer('area_max')
      table.integer('rent_min')
      table.integer('rent_max')
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
