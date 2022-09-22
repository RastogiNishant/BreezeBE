'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { BUILDING_STATUS_FIRST_TIME_OCCUPIED } = require('../../app/constants')

class RemoveDefaultOnBuildingStatusSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('building_status').alter().nullable().defaultTo(null)
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.integer('building_status').alter().defaultTo(BUILDING_STATUS_FIRST_TIME_OCCUPIED)
    })
  }
}

module.exports = RemoveDefaultOnBuildingStatusSchema
