'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterSalutationSchema extends Schema {
  up() {
    this.table('estate_current_tenants', (table) => {
      // alter table
      table.string('salutation', 50).alter()
      table.integer('salutation_int')
    })
  }

  down() {
    this.table('estate_current_tenants', (table) => {
      // reverse alternations
      table.dropColumn('salutation_int')
    })
  }
}

module.exports = AlterSalutationSchema
