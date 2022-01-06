'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterUserPremiumPlanSchema extends Schema {
  up () {
    this.table('user_premium_plans', (table) => {
      // alter table
      table.dropUnique(['premium_id', 'user_id'])
      table.unique(['premium_id', 'user_id'])
    })
  }

  down () {
    this.table('user_premium_plans', (table) => {
      // reverse alternations
      table.dropUnique(['premium_id', 'user_id'])
    })
  }
}

module.exports = AlterUserPremiumPlanSchema
