'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddBuildingIdToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('build_id').unsigned().references('id').inTable('buildings')
      table.index('build_id')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('build_id')
    })
  }
}

module.exports = AddBuildingIdToEstatesSchema
