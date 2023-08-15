'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddWbsLinkToCitiesSchema extends Schema {
  up() {
    this.table('cities', (table) => {
      // alter table
      table.string('wbs_link', 500)
    })
  }

  down() {
    this.table('cities', (table) => {
      // reverse alternations
      table.dropColumn('wbs_link')
    })
  }
}

module.exports = AddWbsLinkToCitiesSchema
