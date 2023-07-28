'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CitiesSchema extends Schema {
  up() {
    this.create('cities', (table) => {
      table.increments()
      table.string('country', 30).index()
      table.string('alpha2', 2)
      table.string('other_name')
      table.string('city', 50).index()
    })
  }

  down() {
    this.drop('cities')
  }
}

module.exports = CitiesSchema
