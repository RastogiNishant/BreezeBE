'use strict'

const Schema = use('Schema')

class EstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.integer('household_type').unsigned().unsigned()
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('household_type')
    })
  }
}

module.exports = EstatesSchema
