'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemoveShownFieldsTenantSchema extends Schema {
  up () {
    this.table('tenants', (table) => {
      // alter table
      table.dropColumn('personal_shown')
      table.dropColumn('income_shown')
      table.dropColumn('residency_shown')
      table.dropColumn('creditscore_shown')
      table.dropColumn('solvency_shown')
      table.dropColumn('profile_shown')
    })
  }

  down () {
    this.table('tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = RemoveShownFieldsTenantSchema
