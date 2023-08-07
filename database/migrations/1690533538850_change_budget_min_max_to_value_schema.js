'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Tenant = use('App/Models/Tenant')
const Database = use('Database')

class ChangeBudgetMinMaxToValueSchema extends Schema {
  async up() {
    await Database.raw(
      ` UPDATE tenants set budget_min = (income * budget_min)/100 where income is not null and budget_min is not null`
    )
    await Database.raw(
      ` UPDATE tenants set budget_max = (income * budget_max)/100 where income is not null and budget_max is not null`
    )
  }

  down() {
    this.table('change_budget_min_max_to_values', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ChangeBudgetMinMaxToValueSchema
