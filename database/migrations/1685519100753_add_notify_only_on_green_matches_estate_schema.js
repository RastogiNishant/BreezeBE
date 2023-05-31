'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNotifyOnlyOnGreenMatchesEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table
        .boolean('notify_on_green_matches')
        .default(false)
        .comment('whether to count only green matches before notifying landlord')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('notify_on_green_matches')
    })
  }
}

module.exports = AddNotifyOnlyOnGreenMatchesEstateSchema
