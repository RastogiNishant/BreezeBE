'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IncomeLevelTo100LengthSchema extends Schema {
  up() {
    this.table('tenant_certificates', (table) => {
      // alter table
      table.string('income_level', 100).alter()
    })
  }

  down() {
    this.table('tenant_certificates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = IncomeLevelTo100LengthSchema
