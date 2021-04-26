'use strict'

const Schema = use('Schema')

class EstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.dropColumn('adult_age_class')
      table.integer('min_age').unsigned()
      table.integer('max_age').unsigned()
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('min_age')
      table.dropColumn('max_age')
      table.integer('adult_age_class').unsigned()
    })
  }
}

module.exports = EstateSchema
