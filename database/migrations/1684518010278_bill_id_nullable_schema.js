'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BillIdNullableSchema extends Schema {
  up() {
    this.alter('bills', (table) => {
      // alter table
      table.string('bill_id').nullable().alter()
    })
  }

  down() {
    this.table('bill_id_nullables', (table) => {
      // reverse alternations
    })
  }
}

module.exports = BillIdNullableSchema
