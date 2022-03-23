'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BillingAddressSchema extends Schema {
  up () {
    this.create('billing_addresses', (table) => {
      table.increments()
      table.timestamps()
      table.integer('user_id').unsigned().references('id').inTable('users').notNullable()
      table.string('name', 32).notNullable()
      table.string('phone', 32)
      table.string('address', 255).notNullable()
      table.string('address1', 255)
      table.string('country', 32).notNullable()
      table.string('city', 32).notNullable()
      table.string('zipcode', 32).notNullable()
    })
  }

  down () {
    this.drop('billing_addresses')
  }
}

module.exports = BillingAddressSchema
