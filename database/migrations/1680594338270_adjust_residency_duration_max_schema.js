'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Tenant = use('App/Models/Tenant')

class AdjustResidencyDurationMaxSchema extends Schema {
  async up() {
    await Tenant.query().where('residency_duration_max', 0).update({ residency_duration_max: null })
  }

  down() {}
}

module.exports = AdjustResidencyDurationMaxSchema
