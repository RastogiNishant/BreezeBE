'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIncomeLevelToTenantsSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      // alter table
      table
        .specificType('income_level', 'TEXT[]')
        .comment('what income level a prospect is searched')
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
      table.dropColumn('income_level')
    })
  }
}

module.exports = AddIncomeLevelToTenantsSchema
