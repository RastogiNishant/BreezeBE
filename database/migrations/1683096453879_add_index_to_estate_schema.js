'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.index('user_id')
      table.index('point_id')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddIndexToEstateSchema
