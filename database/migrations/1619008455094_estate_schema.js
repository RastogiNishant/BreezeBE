'use strict'

const Schema = use('Schema')

class EstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.string('address', 500)
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('address')
    })
  }
}

module.exports = EstateSchema
