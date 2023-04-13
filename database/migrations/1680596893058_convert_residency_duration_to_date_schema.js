'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Tenant = use('App/Models/Tenant')
const Database = use('Database')

class ConvertResidencyDurationToDateSchema extends Schema {
  async up() {
    await Database.raw(
      `UPDATE tenants SET residency_duration_max = (residency_duration_max * 31) WHERE residency_duration_max IS NOT NULL`
    )
    await Tenant.query()
      .whereNotNull('residency_duration_max')
      .update({ residency_duration_min: 0 })
  }

  down() {}
}

module.exports = ConvertResidencyDurationToDateSchema
