'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPublishStatusEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.integer('publish_status').defaultTo(0)
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('publish_status')
    })
  }
}

module.exports = AddPublishStatusEstateSchema
