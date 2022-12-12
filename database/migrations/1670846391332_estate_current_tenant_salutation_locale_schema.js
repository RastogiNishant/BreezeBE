'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const {
  SALUTATION_MR,
  SALUTATION_MR_LABEL,
  SALUTATION_MS,
  SALUTATION_MS_LABEL,
  SALUTATION_SIR_OR_MADAM_LABEL,
} = require('../../app/constants')
class EstateCurrentTenantSalutationLocaleSchema extends Schema {
  async up() {
    const currentTenants = (await EstateCurrentTenant.query().fetch()).toJSON() || []

    let i = 0
    while (i < currentTenants.length) {
      const partialTenants = currentTenants.splice(i, 20)
      await Promise.all(
        partialTenants.map(async (tenant) => {
          const saluation_int = parseInt(tenant.salutation_int)
          const salutation =
            saluation_int === SALUTATION_MR
              ? SALUTATION_MR_LABEL
              : saluation_int === SALUTATION_MS
              ? SALUTATION_MS_LABEL
              : SALUTATION_SIR_OR_MADAM_LABEL

          await EstateCurrentTenant.query().where('id', tenant.id).update({
            salutation,
          })
        })
      )
      i += 20
    }
  }

  down() {
    this.table('estate_current_tenant_salutation_locales', (table) => {
      // reverse alternations
    })
  }
}

module.exports = EstateCurrentTenantSalutationLocaleSchema
