'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOrderToImagesSchema extends Schema {
  up() {
    this.table('files', (table) => {
      // alter table
      table.integer('order').unsigned().defaultTo(1000)
    })
  }

  down() {
    this.table('files', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddOrderToImagesSchema
