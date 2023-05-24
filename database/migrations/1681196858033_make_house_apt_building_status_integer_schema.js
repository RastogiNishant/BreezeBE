'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeHouseAptBuildingStatusIntegerSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table.integer('house_type').unsigned().alter()
      table.integer('apt_type').unsigned().alter()
      table.integer('building_status').unsigned().alter()
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.smallint('house_type').alter()
      table.smallint('apt_type').alter()
      table.smallint('building_status').alter()
    })
  }
}

module.exports = MakeHouseAptBuildingStatusIntegerSchema
