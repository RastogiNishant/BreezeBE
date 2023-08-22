'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCanPublishToBuildingSchema extends Schema {
  up() {
    this.table('buildings', (table) => {
      // alter table
      table.boolean('can_publish').defaultTo(false)
    })
  }

  down() {
    this.table('buildings', (table) => {
      // reverse alternations
      table.dropColumn('can_publish')
    })
  }
}

module.exports = AddCanPublishToBuildingSchema
