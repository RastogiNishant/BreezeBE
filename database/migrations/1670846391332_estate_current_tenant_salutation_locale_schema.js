'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const {
  SALUTATION_MS_LABEL,
  SALUTATION_SIR_OR_MADAM_LABEL,
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_NEUTRAL,
  SALUTATION_NEUTRAL_LABEL,
  SALUTATION_MR_LABEL,
} = require('../../app/constants')
class EstateCurrentTenantSalutationLocaleSchema extends Schema {
  async up() {
    const currentTenants = (await EstateCurrentTenant.query().fetch()).toJSON() || []

    let i = 0
    while (i < currentTenants.length) {
      const partialTenants = currentTenants.slice(i, i + 20)
      await Promise.all(
        partialTenants.map(async (tenant) => {
          const saluation_int = parseInt(tenant.salutation_int)
          const salutation =
            saluation_int === GENDER_MALE
              ? SALUTATION_MR_LABEL
              : saluation_int === GENDER_FEMALE
              ? SALUTATION_MS_LABEL
              : saluation_int === GENDER_NEUTRAL
              ? SALUTATION_NEUTRAL_LABEL
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
