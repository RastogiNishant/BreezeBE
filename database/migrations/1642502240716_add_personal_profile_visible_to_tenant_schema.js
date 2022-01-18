'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPersonalProfileVisibleToTenantSchema extends Schema {
  up () {
    this.table('tenants', (table) => {
      // alter table
      table.boolean('personal_shown').defaultTo(true)
      table.boolean('income_shown').defaultTo(true)
      table.boolean('residency_shown').defaultTo(true)
      table.boolean('creditscore_shown').defaultTo(true)
      table.boolean('solvency_shown').defaultTo(true)
      table.boolean('profile_shown').defaultTo(true)      
    })
  }

  down () {
    this.table('tenants', (table) => {
      // reverse alternations
      table.dropColumn('personal_shown')
      table.dropColumn('income_shown')
      table.dropColumn('residency_shown')
      table.dropColumn('creditscore_shown')
      table.dropColumn('solvency_shown')
      table.dropColumn('profile_shown')
    })
  }
}

module.exports = AddPersonalProfileVisibleToTenantSchema
