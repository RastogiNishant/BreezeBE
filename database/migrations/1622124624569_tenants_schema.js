'use strict'

const Schema = use('Schema')

class TenantsSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.specificType('options', 'INT[]')
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('options')
    })
  }
}

module.exports = TenantsSchema
