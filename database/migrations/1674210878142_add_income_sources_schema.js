'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIncomeSourcesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.specificType('income_sources', 'character varying(50)[]')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddIncomeSourcesSchema
