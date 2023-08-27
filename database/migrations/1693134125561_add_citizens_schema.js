'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCitizensSchema extends Schema {
  up() {
    this.create('citizens', (table) => {
      table.increments()
      table.string('citizen_key', 150).notNullable().unique()
      table.string('en_name', 255)
      table.string('de_name', 255)
      table.index('citizen_key')
      table.timestamps()
    })
  }

  down() {
    this.drop('add_citizens')
  }
}

module.exports = AddCitizensSchema
