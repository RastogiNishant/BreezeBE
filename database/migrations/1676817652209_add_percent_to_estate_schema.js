'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPercentToEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.decimal('percent').defaultTo(0.0)
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('percent').defaultTo(0)
    })
  }
}

module.exports = AddPercentToEstateSchema
