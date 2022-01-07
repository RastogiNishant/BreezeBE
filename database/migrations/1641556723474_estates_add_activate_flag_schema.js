'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstateAddActivateFlagSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.boolean('is_active').defaultTo(true)
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('is_active')
    })
  }
}

module.exports = EstateAddActivateFlagSchema
