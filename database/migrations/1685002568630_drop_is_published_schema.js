'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DropIsPublishedSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.dropColumn('is_published')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.boolean('is_published').defaultTo(false)
    })
  }
}

module.exports = DropIsPublishedSchema
