'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstateFloorToNullSchema extends Schema {
  up() {
    this.alter('estates', (table) => {
      // alter table
      table.integer('floor').unsigned().nullable().alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = EstateFloorToNullSchema
