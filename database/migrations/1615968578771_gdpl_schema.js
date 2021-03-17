'use strict'

const Schema = use('Schema')

const { STATUS_ACTIVE } = require('../../app/constants')

class GdplSchema extends Schema {
  up() {
    this.create('agreements', (table) => {
      table.increments()
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.string('title', 1000)
      table.text('body')
      table.timestamps()
    })

    this.create('terms', (table) => {
      table.increments()
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.string('title', 1000)
      table.text('body')
      table.timestamps()
    })
  }

  down() {
    this.drop('agreements')
    this.drop('terms')
  }
}

module.exports = GdplSchema
