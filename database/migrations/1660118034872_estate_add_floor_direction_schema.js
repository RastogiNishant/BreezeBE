'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstateAddFloorDirectionSchema extends Schema {
  up () {
    this.table('estate_add_floor_directions', (table) => {
      // alter table
    })
  }

  down () {
    this.table('estate_add_floor_directions', (table) => {
      // reverse alternations
    })
  }
}

module.exports = EstateAddFloorDirectionSchema
