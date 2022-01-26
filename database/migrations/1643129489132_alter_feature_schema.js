'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterFeatureSchema extends Schema {
  up () {
    this.table('premium_features', (table) => {
      // alter table
      table.boolean('belong_to_basic_plan').defaultTo(false)
      table.boolean('belong_to_premium_plan').defaultTo(false)
    })
  }

  down () {
    this.table('premium_features', (table) => {
      // reverse alternations
      table.dropColumn('belong_to_basic_plan')
      table.dropColumn('belong_to_premium_plan')
    })
  }
}

module.exports = AlterFeatureSchema
