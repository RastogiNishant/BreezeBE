'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Option = use('App/Models/Option')

class AddBarrierFreeToBuildInOptionsSchema extends Schema {
  async up() {
    await Option.query().insert({
      title: 'landlord.property.details.building_amenities.barrier_free',
      type: 'build',
      order: 75,
    })
  }

  down() {}
}

module.exports = AddBarrierFreeToBuildInOptionsSchema
