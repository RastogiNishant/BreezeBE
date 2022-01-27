'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterUserPremiumPlanSchema extends Schema {
  up () {
    this.table('user_premium_plans', (table) => {
      // alter table
      table.dropColumn('premium_id')

      table.integer('plan_id').unsigned().index()
      table.foreign('plan_id').references('id').on('plans').onDelete('cascade')

    })
  }

  down () {
    this.table('user_premium_plans', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterUserPremiumPlanSchema
