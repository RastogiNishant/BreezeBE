'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCanPublishToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.boolean('can_publish').defaultTo(false)
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddCanPublishToEstatesSchema
