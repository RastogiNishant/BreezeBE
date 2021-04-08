'use strict'

const Schema = use('Schema')

class EstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.string('cover', 254)
      table.json('plan')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('cover')
      table.dropColumn('plan')
    })
  }
}

module.exports = EstateSchema
