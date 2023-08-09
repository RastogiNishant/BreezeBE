'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreateTenantCertificationSchema extends Schema {
  up() {
    this.create('tenant_certificates', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users').notNullable()
      table.integer('city_id').unsigned().references('id').inTable('cities').notNullable()
      table.string('income_level', 10).notNullable()
      table.string('uri', 255).notNullable()
      table.string('file_name', 255).notNullable()
      table.string('disk', 60).notNullable()
      table.date('expired_at')
      table.integer('status').defaultTo(STATUS_ACTIVE)
      table.index('user_id')
      table.index('city_id')
      table.index('country_id')

      table.timestamps()
    })
  }

  down() {
    this.drop('tenant_certificates')
  }
}

module.exports = CreateTenantCertificationSchema
