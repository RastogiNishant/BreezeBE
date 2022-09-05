'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class EstateCreditScoreToDecimalSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.decimal('credit_score', 5, 2).alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.integer('credit_score').alter()
    })
  }
}

module.exports = EstateCreditScoreToDecimalSchema
