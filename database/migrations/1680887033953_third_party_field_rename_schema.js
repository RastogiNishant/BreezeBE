'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyFieldRenameSchema extends Schema {
  up() {
    this.alter('third_party_offers', (table) => {
      // alter table
      table.renameColumn('price', 'net_rent')
      table.renameColumn('floor_count', 'number_floors')
      table.renameColumn('rooms', 'rooms_number')
      table.renameColumn('vacant_from', 'vacant_date')
    })
  }

  down() {
    this.alter('third_party_offers', (table) => {
      // reverse alternations
      table.renameColumn('net_rent', 'price')
      table.renameColumn('number_floors', 'floor_count')
      table.renameColumn('rooms_number', 'rooms')
      table.renameColumn('vacant_date', 'vacant_from')
    })
  }
}

module.exports = ThirdPartyFieldRenameSchema
