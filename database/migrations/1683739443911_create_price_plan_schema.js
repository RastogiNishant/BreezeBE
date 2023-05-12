'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreatePricePlanSchema extends Schema {
  up() {
    this.create('price_plans', (table) => {
      table.increments()
      table.integer('plan_id').notNullable().index()
      table.integer('product_id').notNullable().index()
      table.string('price_id').notNullable().comment('price id from stripe')
      table.string('description')
      table.unique('product_id')
      table.integer('status').notNullable().defaultTo(STATUS_ACTIVE)
      table.timestamps()
    })
  }

  down() {
    this.drop('price_plans')
  }
}

module.exports = CreatePricePlanSchema
