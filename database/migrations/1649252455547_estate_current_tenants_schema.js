'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { STATUS_ACTIVE } = require('../../app/constants')

class EstateCurrentTenantsSchema extends Schema {
  up() {
    this.create('estate_current_tenants', (table) => {
      table.increments()
      table.string('salutation', 10)
      table.string('email', 255)
      table.string('surname', 255)
      table.string('phone_number', 20)
      table.integer('estate_id').unsigned().references('id').inTable('estates')
      table.date('contract_end')
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.integer('user_id').unsigned().nullable().references('id').inTable('users')
      table.timestamps()
    })
  }

  down() {
    this.drop('estate_current_tenants')
  }
}

module.exports = EstateCurrentTenantsSchema
