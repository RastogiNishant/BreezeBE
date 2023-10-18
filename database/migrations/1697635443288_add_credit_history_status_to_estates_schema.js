'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCreditHistoryStatusToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('credit_history_status').comment('this will replace credit_score')
      table.integer('credit_score').unsigned().comment('this will NOT be used anymore.')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('credit_history_status')
    })
  }
}

module.exports = AddCreditHistoryStatusToEstatesSchema
