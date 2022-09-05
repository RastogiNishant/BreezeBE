'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IndexFloorDirectionSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.index('floor_direction')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropIndex('floor_direction')
    })
  }
}

module.exports = IndexFloorDirectionSchema
