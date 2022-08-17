'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddContractEndToEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.datetime('rent_end_at', { useTz: false })
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddContractEndToEstateSchema
