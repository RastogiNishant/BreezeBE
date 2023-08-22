'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCanPublishToBuildingSchema extends Schema {
  up () {
    this.table('add_can_publish_to_buildings', (table) => {
      // alter table
    })
  }

  down () {
    this.table('add_can_publish_to_buildings', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddCanPublishToBuildingSchema
