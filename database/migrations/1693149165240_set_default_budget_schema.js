'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class SetDefaultBudgetSchema extends Schema {
  async up() {
    await Database.raw('UPDATE estates set budget = 30 where budget > 100')
  }

  down() {}
}

module.exports = SetDefaultBudgetSchema
