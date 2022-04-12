'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFamilySizeMaxToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('family_size_max').nullable()
      table.boolean('pets_allowed').nullable()
      table.integer('apartment_status').nullable()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('family_size_max')
      table.dropColumn('pets_allowed')
      table.dropColumn('apartment_status')
    })
  }
}

module.exports = AddFamilySizeMaxToEstatesSchema
