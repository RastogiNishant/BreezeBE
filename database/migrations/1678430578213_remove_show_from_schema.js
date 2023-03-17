'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemoveShowFromSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.dropColumn('from_date')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.date('from_date', { useTz: false })
    })
  }
}

module.exports = RemoveShowFromSchema
