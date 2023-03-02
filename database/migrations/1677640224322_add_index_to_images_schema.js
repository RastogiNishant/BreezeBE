'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToImagesSchema extends Schema {
  up() {
    this.table('images', (table) => {
      // alter table
      table.index('room_id')
    })
  }

  down() {
    this.table('images', (table) => {
      // reverse alternations
      table.dropIndex('room_id')
    })
  }
}

module.exports = AddIndexToImagesSchema
