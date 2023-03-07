'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddAvailableStartAtAvailableEndAtToEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.datetime('available_start_at', { useTz: false })
      table.datetime('available_end_at', { useTz: false })
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('available_start_at')
      table.dropColumn('available_end_at')
    })
  }
}

module.exports = AddAvailableStartAtAvailableEndAtToEstateSchema
