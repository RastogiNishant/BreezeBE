'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { ROLE_USER } = require('../../app/constants')

class AddRoleToPlanSchema extends Schema {
  up () {
    this.table('plans', (table) => {
      // alter table
      table.integer('role').default(ROLE_USER)
      table.boolean('prospect_free_plan').default(false)
      table.boolean('landlord_free_plan').default(false)
      table.boolean('status').default(true)
    })
  }

  down () {
    this.table('plans', (table) => {
      // reverse alternations
      table.dropColumn('role')
      table.dropColumn('prospect_free_plan')
      table.dropColumn('landlord_free_plan')
      table.dropColumn('status')
    })
  }
}

module.exports = AddRoleToPlanSchema
