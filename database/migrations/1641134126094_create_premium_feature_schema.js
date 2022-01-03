'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreatePremiumFeatureSchema extends Schema {
  up () {
    this.create('premium_features', (table) => {
      table.increments()
      table.string('feature', 500)
      table.string('description', 500)
      table.timestamps()
    })
  }

  down () {
    this.drop('premium_features')
  }
}

module.exports = CreatePremiumFeatureSchema
