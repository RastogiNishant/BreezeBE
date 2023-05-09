'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddShareLinkToEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.string('share_link')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('share_link')
    })
  }
}

module.exports = AddShareLinkToEstateSchema
