'use strict'

const Schema = use('Schema')

class EstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.integer('apt_type').unsigned()
      table.integer('house_type').unsigned()
      table.dropColumn('type')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.integer('type').unsigned()
      table.dropColumn('apt_type')
      table.dropColumn('house_type')
    })
  }
}

module.exports = EstateSchema
