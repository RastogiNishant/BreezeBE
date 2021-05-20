'use strict'

const Schema = use('Schema')

class TenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.integer('credit_score').unsigned()
      table.integer('members_count').unsigned()
      table.integer('minors_count').unsigned()
      table.boolean('unpaid_rental')
      table.boolean('insolvency_proceed')
      table.boolean('arrest_warranty')
      table.boolean('clean_procedure')
      table.boolean('income_seizure')
      table.boolean('non_smoker')
      table.integer('family_status')
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('credit_score')
      table.dropColumn('members_count')
      table.dropColumn('minors_count')
      table.dropColumn('unpaid_rental')
      table.dropColumn('insolvency_proceed')
      table.dropColumn('arrest_warranty')
      table.dropColumn('clean_procedure')
      table.dropColumn('income_seizure')
      table.dropColumn('non_smoker')
      table.dropColumn('family_status')
    })
  }
}

module.exports = TenantSchema
