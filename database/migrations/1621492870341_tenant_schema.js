'use strict'

const Schema = use('Schema')

class TenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.specificType('members_age', 'INT[]')
    })

    this.table('estates', (table) => {
      table.integer('family_status').unsigned()
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('members_age')
    })

    this.table('estates', (table) => {
      table.dropColumn('family_status')
    })
  }
}

module.exports = TenantSchema
