'use strict'

const { STATUS_ACTIVE, STATUS_DELETE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Estate = use('App/Models/Estate')
const { max } = require('lodash')

class RemoveDuplicateCurrentTenantSchema extends Schema {
  async up() {
    const estates = (await Estate.query().select('id').whereNot('status', STATUS_DELETE).fetch())
      .rows

    estates.map(async (estate) => {
      const currentTenants = (
        await EstateCurrentTenant.query()
          .where('estate_id', estate.id)
          .where('status', STATUS_ACTIVE)
          .fetch()
      ).rows
      if (currentTenants && currentTenants.length > 1) {
        const created_dates = currentTenants.map((currentTenant) => currentTenant.created_at)
        const latest_created_date = max(created_dates)
        const oldCurrentTenants = currentTenants.filter(
          (ct) => ct.created_at !== latest_created_date
        )
        const oldCurrentTenantIds = oldCurrentTenants.map((ct) => ct.id)

        await EstateCurrentTenant.query().whereIn('id', oldCurrentTenantIds).delete()
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
