'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOrderToImagesSchema extends Schema {
  up () {
    this.table('images', (table) => {
      // alter table
      table.integer('order').defaultTo(100000)      
    })
  }

  down () {
    this.table('images', (table) => {
      // reverse alternations
      table.integer('order').defaultTo(100000)      
    })
  }
}

module.exports = AddOrderToImagesSchema
