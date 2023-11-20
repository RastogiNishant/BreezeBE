'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DefaultToOneMembersCountTenantsSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.integer('members_count').unsigned().defaultTo(1).alter()
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = DefaultToOneMembersCountTenantsSchema
