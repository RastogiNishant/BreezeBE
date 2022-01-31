'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterFeaturePlanSchema extends Schema {
  up () {
    this.table('premium_features', (table) => {
      // alter table
      table.dropColumn('is_basic_plan')
      table.dropColumn('is_premium_plan')

      table.dropColumn('belong_to_basic_plan')
      table.dropColumn('belong_to_premium_plan')

      table.integer('plan_id').unsigned().references('id').inTable('plans')
    })
  }

  down () {
    this.table('premium_features', (table) => {
      // reverse alternations

      table.boolean('is_basic_plan').defaultTo(false)
      table.boolean('is_premium_plan').defaultTo(false)

      table.boolean('belong_to_basic_plan').defaultTo(false)
      table.boolean('belong_to_premium_plan').defaultTo(false)

      table.dropColumn('plan_id')
    })
  }
}

module.exports = AlterFeaturePlanSchema
