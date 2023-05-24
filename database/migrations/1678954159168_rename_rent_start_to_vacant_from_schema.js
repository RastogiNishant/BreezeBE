'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RenameRentStartToVacantFromSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.renameColumn('rent_start', 'vacant_from')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.renameColumn('vacant_from', 'rent_start')
    })
  }
}

module.exports = RenameRentStartToVacantFromSchema
