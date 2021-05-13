'use strict'

const Schema = use('Schema')
const {
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
} = require('../../app/constants')

class TenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.string('coord_raw', 25)
    })

    this.table('points', (table) => {
      table.enum('dist_type', [TRANSPORT_TYPE_CAR, TRANSPORT_TYPE_WALK, TRANSPORT_TYPE_SOCIAL])
      table.integer('dist_min').unsigned() // 0(max), 15, 30, 45, 60
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('coord_raw')
    })

    this.table('points', (table) => {
      table.dropColumn('dist_type')
      table.dropColumn('dist_min')
    })
  }
}

module.exports = TenantSchema
