'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PlansSchema extends Schema {
  up () {
    this.alter('plans', (table) => {
      // alter table
      table.string('price');   
      table.string('lettings');   
      table.string('discount');   

    })
  }

  down () {
    this.alter('plans', (table) => {
      // reverse alternations
      table.dropColumn('price')
      table.dropColumn('lettings')
      table.dropColumn('discount')
    })
  }
}

module.exports = PlansSchema
