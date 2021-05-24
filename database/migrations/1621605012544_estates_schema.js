'use strict'

const Schema = use('Schema')

class EstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.integer('parking_space').unsigned()
    })

    // this.table('tenants', (table) => {
    //   table.integer('parking_space').unsigned()
    // })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('parking_space')
    })
  }
}

module.exports = EstatesSchema
