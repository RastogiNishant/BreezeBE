'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Tenant = use('App/Models/Tenant')

class AdjustShortTermRentSchema extends Schema {
  async up() {
    await Tenant.query()
      .where('residency_duration_max', '>', 0)
      .update({ is_short_term_rent: true })
  }

  down() {}
}

module.exports = AdjustShortTermRentSchema
