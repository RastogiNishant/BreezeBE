'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreateUserPremiumPlanSchema extends Schema {
  up () {
    this.create('user_premium_plans', (table) => {
      table.increments()

      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('cascade')

      table.integer('premium_id').unsigned().index()
      table.foreign('premium_id').references('id').on('premium_features').onDelete('cascade')

      table.timestamps()
    })
  }

  down () {
    this.drop('user_premium_plans')
  }
}

module.exports = CreateUserPremiumPlanSchema
