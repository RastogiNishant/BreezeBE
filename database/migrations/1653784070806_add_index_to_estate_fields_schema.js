'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToEstateFieldsSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.index('address')
      table.index('area')
      table.index('floor')
      table.index('letting_status')
      table.index('letting_type')
      table.index('net_rent')
      table.index('number_floors')
      table.index('property_type')
      table.index('rooms_number')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropIndex('address')
      table.dropIndex('area')
      table.dropIndex('floor')
      table.dropIndex('letting_status')
      table.dropIndex('letting_type')
      table.dropIndex('net_rent')
      table.dropIndex('number_floors')
      table.dropIndex('property_type')
      table.dropIndex('rooms_number')
    })
  }
}

module.exports = AddIndexToEstateFieldsSchema
