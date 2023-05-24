'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToIncomeProofsSchema extends Schema {
  up() {
    this.table('income_proofs', (table) => {
      // alter table
      table.index('income_id')
      table.index(['income_id', 'type'])
      table.index(['income_id', 'expire_date'])
      table.index('expire_date')
    })
  }

  down() {
    this.table('income_proofs', (table) => {
      // reverse alternations
      table.dropIndex('income_id')
      table.dropIndex(['income_id', 'type'])
      table.dropIndex(['income_id', 'expire_date'])
      table.dropIndex('expire_date')
    })
  }
}

module.exports = AddIndexToIncomeProofsSchema
