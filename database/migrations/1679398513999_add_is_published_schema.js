'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIsPublishedSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.boolean('is_published').defaultTo(false)
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('is_published')
    })
  }
}

module.exports = AddIsPublishedSchema
