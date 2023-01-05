'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IncreaseSalutationSizeSchema extends Schema {
  up() {
    this.table('estate_current_tenants', (table) => {
      // alter table
      table.string('salutation', 100).alter()
    })
  }

  down() {
    this.table('estate_current_tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = IncreaseSalutationSizeSchema
