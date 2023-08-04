'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Tenant = use('App/Models/Tenant')
const Promise = require('bluebird')

class AdjustResidencyDurationSchema extends Schema {
  async up() {
    const tenants = (await Tenant.query().fetch()).toJSON()
    const updateList = []
    await Promise.map(
      tenants,
      async (tenant) => {
        let residency_min = tenant.residency_duration_min
        let residency_max = tenant.residency_duration_max
        let flag = false
        if (residency_min && residency_max) {
          if (residency_max > 0 && residency_max <= 31) {
            residency_min = residency_min >= 31 ? 1 : residency_min
            flag = true
          } else if (residency_max > 31 && residency_max <= 56) {
            residency_min = residency_min >= 56 ? 7 : parseInt(residency_min / 7)
            flag = true
          } else {
            residency_max = 1116
            residency_min = residency_min >= 1116 ? 31 : parseInt(residency_min / 7)
            flag = true
          }
        }
        if (flag) {
          await Tenant.query()
            .where('id', tenant.id)
            .update({
              residency_duration_min: residency_min,
              residency_duration_max: residency_max,
            })
        }
      },
      { concurrency: 1 }
    )
  }

  down() {}
}

module.exports = AdjustResidencyDurationSchema
