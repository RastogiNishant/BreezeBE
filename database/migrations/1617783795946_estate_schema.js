'use strict'

const Schema = use('Schema')

class EstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.dropColumn('rooms')
      table.string('property_id', 20).index()
    })

    this.alter('rooms', (table) => {
      table.dropColumn('options')
    })

    this.alter('rooms', (table) => {
      table.json('options')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.json('rooms')
      table.dropColumn('property_id')
    })
  }
}

module.exports = EstateSchema
