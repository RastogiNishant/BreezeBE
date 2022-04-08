'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TenantSelectedAdultsCountColumn extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.integer('selected_adults_count').unsigned().defaultTo(0)
    })
  }
}

module.exports = TenantSelectedAdultsCountColumn
