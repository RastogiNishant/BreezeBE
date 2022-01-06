'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterPremiumFeatureSchema extends Schema {
  up () {
    this.table('premium_features', (table) => {
      // alter table

      table.boolean('is_basic_plan').defaultTo(false)
      table.boolean('is_premium_plan').defaultTo(false)
      table.decimal('prices').defaultTo(0)
      table.boolean('status').defaultTo(true)
    })
  }

  down () {
    this.table('premium_features', (table) => {
      // reverse alternations
      table.dropColumn('is_basic_plan')
      table.dropColumn('is_premium_plan')
      table.dropColumn('prices')
      table.dropColumn('status')
    })
  }
}

module.exports = AlterPremiumFeatureSchema
