'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddMoreIndexToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.string('country', 255).index().alter()
      table.string('city', 40).index().alter()
      table.string('zip', 7).index().alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropIndex('country')
      table.dropIndex('city')
      table.dropIndex('zip')
    })
  }
}

module.exports = AddMoreIndexToEstatesSchema
