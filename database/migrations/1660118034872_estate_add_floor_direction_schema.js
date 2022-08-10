'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstateAddFloorDirectionSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.smallint('floor_direction')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('floor_direction')
    })
  }
}

module.exports = EstateAddFloorDirectionSchema
