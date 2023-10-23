'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IsDurationLaterToFalseSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.boolean('is_duration_later').defaultTo(false).alter()
    })
  }

  down() {
    this.table('is_duration_later_to_falses', (table) => {
      // reverse alternations
    })
  }
}

module.exports = IsDurationLaterToFalseSchema
