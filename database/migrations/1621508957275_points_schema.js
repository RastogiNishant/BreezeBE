'use strict'

const Schema = use('Schema')

class PointsSchema extends Schema {
  up() {
    this.table('points', (table) => {
      table.specificType('zone', 'geometry(polygon, 4326)')
    })
  }

  down() {
    this.table('points', (table) => {
      table.dropColumn('zone')
    })
  }
}

module.exports = PointsSchema
