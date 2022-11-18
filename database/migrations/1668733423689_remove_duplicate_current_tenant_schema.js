'use strict'

const { STATUS_ACTIVE, STATUS_DELETE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Estate = use('App/Models/Estate')

class RemoveDuplicateCurrentTenantSchema extends Schema {
  async up() {
    const estates = (
      await Estate.query().with('current_tenant').whereNot('status', STATUS_DELETE).fetch()
    ).rows

    estates.map(async (estate) => {
      if (estate.toJSON().current_tenant) {
        console.log('Current estate Estates here=', estate.toJSON().current_tenant)
      }
    })
  }

  down() {
    this.table('remove_duplicate_current_tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = RemoveDuplicateCurrentTenantSchema
