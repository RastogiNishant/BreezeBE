'use strict'

const Schema = use('Schema')

class EstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.integer('point_id').unsigned().references('id').inTable('points')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('point_id')
    })
  }
}

module.exports = EstateSchema
