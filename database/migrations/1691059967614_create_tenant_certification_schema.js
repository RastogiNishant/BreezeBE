'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreateTenantCertificationSchema extends Schema {
  up() {
    this.create('tenant_certifications', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('city_id').unsigned().references('id').inTable('cities')
      table.string('income_level')
      table.date('expired_date')
      table.index('user_id')
      table.index('city_id')

      table.timestamps()
    })
  }

  down() {
    this.drop('tenant_certifications')
  }
}

module.exports = CreateTenantCertificationSchema
