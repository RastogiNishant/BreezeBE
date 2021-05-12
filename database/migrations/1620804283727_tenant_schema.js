'use strict'

const Schema = use('Schema')

const {
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
  POINT_TYPE_ZONE,
  POINT_TYPE_POI,
} = require('../../app/constants')

class TenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.specificType('coord', 'geometry(point, 4326)')
      table.enum('dist_type', [TRANSPORT_TYPE_CAR, TRANSPORT_TYPE_WALK, TRANSPORT_TYPE_SOCIAL])
      table.integer('dist_min').unsigned() // 0(max), 15, 30, 45, 60
      table.integer('budget_min').unsigned()
      table.integer('budget_max').unsigned()
      table.boolean('include_utility').defaultTo(false)
      table.integer('rooms_min').unsigned()
      table.integer('rooms_max').unsigned()
      table.integer('floor_min').unsigned()
      table.integer('floor_max').unsigned()
      table.integer('space_min').unsigned()
      table.integer('space_max').unsigned()
      table.specificType('apt_type', 'INT[]')
      table.specificType('house_type', 'INT[]')
      table.boolean('garden').defaultTo(false)
    })

    this.table('points', (table) => {
      table.enum('type', [POINT_TYPE_ZONE, POINT_TYPE_POI]).defaultTo(POINT_TYPE_POI)
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('coord')
      table.dropColumn('dist_type')
      table.dropColumn('dist_min')
      table.dropColumn('budget_min')
      table.dropColumn('budget_max')
      table.dropColumn('include_utility')
      table.dropColumn('rooms_min')
      table.dropColumn('rooms_max')
      table.dropColumn('floor_min')
      table.dropColumn('floor_max')
      table.dropColumn('space_min')
      table.dropColumn('space_max')
      table.dropColumn('apt_type')
      table.dropColumn('house_type')
      table.dropColumn('garden')
    })

    this.table('points', (table) => {
      table.dropColumn('type')
    })
  }
}

module.exports = TenantSchema
