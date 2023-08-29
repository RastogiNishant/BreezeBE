'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const Database = use('Database')

class AdjustBudgetToAmountSchema extends Schema {
  async up() {
    await Database.raw(
      ` UPDATE estates set budget = net_rent * 100/budget where budget is not null and budget > 0`
    )
  }

  down() {}
}

module.exports = AdjustBudgetToAmountSchema
