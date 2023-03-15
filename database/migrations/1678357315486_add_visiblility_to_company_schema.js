'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddVisiblilityToCompanySchema extends Schema {
  up() {
    this.table('companies', (table) => {
      // alter table
      table.integer('visibility').defaultTo(0)
    })
  }

  down() {
    this.table('companies', (table) => {
      // reverse alternations
      table.dropColumn('visibility')
    })
  }
}

module.exports = AddVisiblilityToCompanySchema
