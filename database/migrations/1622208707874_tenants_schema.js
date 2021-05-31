'use strict'

const Schema = use('Schema')
const Database = use('Database')

class TenantsSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.specificType('zones', 'INT[]')
    })

    this.table('dislikes', (table) => {
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('zones')
    })

    this.table('dislikes', (table) => {
      table.dropColumn('created_at')
    })
  }
}

module.exports = TenantsSchema
