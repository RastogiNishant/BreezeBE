'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToEstateReportAbusesSchema extends Schema {
  up() {
    this.table('estate_report_abuses', (table) => {
      // alter table
      table.index('estate_id')
      table.index('user_id')
      table.index(['estate_id', 'user_id'])
    })
  }

  down() {
    this.table('estate_report_abuses', (table) => {
      // reverse alternations
      table.dropIndex('estate_id')
      table.dropIndex('user_id')
      table.dropIndex(['estate_id', 'user_id'])
    })
  }
}

module.exports = AddIndexToEstateReportAbusesSchema
