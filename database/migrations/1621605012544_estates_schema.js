'use strict'

const Schema = use('Schema')

const { STATUS_DRAFT } = require('../../app/constants')

class EstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.integer('parking_space').unsigned()
    })

    this.table('tenants', (table) => {
      table.integer('status').unsigned().defaultTo(STATUS_DRAFT)
      table.index('status')
    })

    this.table('matches', (table) => {
      table.boolean('buddy').defaultTo(false)
      table.index('buddy')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('parking_space')
    })

    this.table('tenants', (table) => {
      table.dropColumn('status')
    })

    this.table('matches', (table) => {
      table.dropColumn('buddy')
    })
  }
}

module.exports = EstatesSchema
