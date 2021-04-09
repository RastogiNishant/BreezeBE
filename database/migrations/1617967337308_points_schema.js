'use strict'

const Schema = use('Schema')

class PointsSchema extends Schema {
  up() {
    this.create('points', (table) => {
      table.increments()
      table.decimal('lat', 7, 4).index()
      table.decimal('lon', 7, 4).index()
      table.json('data')
    })
  }

  down() {
    this.drop('points')
  }
}

module.exports = PointsSchema
