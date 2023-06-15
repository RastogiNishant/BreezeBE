'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const User = use('App/Models/User')
const Plan = use('App/Models/Plan')

class RemoveBasicLandlordSchema extends Schema {
  async up() {
    await User.query().where('plan_id', 3).update({ plan_id: null })
    await Plan.query().where('id', 3).delete()
  }

  down() {
    this.table('remove_basic_landlords', (table) => {
      // reverse alternations
    })
  }
}

module.exports = RemoveBasicLandlordSchema
