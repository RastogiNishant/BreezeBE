'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIsShortTermRentSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table.boolean('is_short_term_rent').defaultTo(false)
    })
  }

  down() {
    this.table('tenants', (table) => {
      // alter table
      table.dropColumn('is_short_term_rent')
    })
  }
}

module.exports = AddIsShortTermRentSchema
