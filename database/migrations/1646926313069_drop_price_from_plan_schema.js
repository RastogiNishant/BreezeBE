'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DropPriceFromPlanSchema extends Schema {
  up () {
    this.table('plans', (table) => {
      // alter table
      table.dropColumn('prices')      
    })
  }

  down () {
    this.table('plans', (table) => {
      // reverse alternations
    })
  }
}

module.exports = DropPriceFromPlanSchema
