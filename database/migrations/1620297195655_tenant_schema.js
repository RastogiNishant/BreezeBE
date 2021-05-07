'use strict'

const Schema = use('Schema')

class TenantSchema extends Schema {
  up() {
    // User tenant filters
    this.create('tenants', (table) => {
      table.increments()
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .notNullable()
        .onDelete('cascade')
      table.boolean('commercial_use').defaultTo(false)
      table.integer('pets').unsigned()
      table.string('pets_species', 255)
      table.integer('parking_space').unsigned()
      table.unique('user_id')
    })

    // Create income proofs
    this.create('income_proofs', (table) => {
      table.increments()
      table
        .integer('income_id')
        .unsigned()
        .references('id')
        .inTable('incomes')
        .notNullable()
        .onDelete('cascade')
      table.string('file', 255)
      table.date('expire_date', { useTz: false })
    })
  }

  down() {
    this.drop('tenants')
    this.drop('income_proofs')
  }
}

module.exports = TenantSchema
