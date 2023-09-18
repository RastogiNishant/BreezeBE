'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class BudgetToNullIfZeroSchema extends Schema {
  async up() {
    await Database.raw('UPDATE estates set budget = NULL where budget = 0')
  }

  down() {}
}

module.exports = BudgetToNullIfZeroSchema
