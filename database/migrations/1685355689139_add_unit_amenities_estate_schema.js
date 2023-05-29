'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUnitAmenitiesEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.specificType('unit_amenities', 'INT[]')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('unit_amenities')
    })
  }
}

module.exports = AddUnitAmenitiesEstateSchema
