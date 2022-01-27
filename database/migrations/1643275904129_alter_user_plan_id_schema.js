'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterUserPlanIdSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.dropColumn('is_premium')
      table.integer('plan_id').unsigned().references('id').inTable('plans')
    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
      table.boolean('is_premium').defaultTo(false)
      table.dropColumn('plan_id')      
    })
  }
}

module.exports = AlterUserPlanIdSchema
