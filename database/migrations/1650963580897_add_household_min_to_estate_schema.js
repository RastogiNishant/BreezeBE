'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddHouseholdMinToEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('family_size_min').default(1)
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('family_size_min')
    })
  }
}

module.exports = AddHouseholdMinToEstateSchema
