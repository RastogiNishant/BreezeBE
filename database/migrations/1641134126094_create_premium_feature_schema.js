'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class CreatePremiumFeatureSchema extends Schema {
  up () {
    this.create('premium_features', (table) => {
      table.increments()
      table.string('feature', 500)
      table.string('description', 500)
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down () {
    this.drop('premium_features')
  }
}

module.exports = CreatePremiumFeatureSchema
