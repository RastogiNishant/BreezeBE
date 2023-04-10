'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PropertyAddressToJsonSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      // alter table
      table.json('property_address').alter()
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
      table.string('property_address').alter()      
    })
  }
}

module.exports = PropertyAddressToJsonSchema
