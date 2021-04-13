'use strict'

const Schema = use('Schema')
class BuildQualitySchema extends Schema {
  up() {
    this.create('build_qualities', (table) => {
      table.increments()
      table.string('name', 100)
      table.string('quality', 10)
      table.json('zip')
      table.string('build_num', 1000)
    })
  }

  down() {
    this.drop('build_qualities')
  }
}

module.exports = BuildQualitySchema

// pg_dump --column-inserts breeze > /dump.sql
