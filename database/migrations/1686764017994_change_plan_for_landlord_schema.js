'use strict'

const { ROLE_LANDLORD } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const User = use('App/Models/User')

class ChangePlanForLandlordSchema extends Schema {
  async up() {
    await User.query().where('role', ROLE_LANDLORD).update({ plan_id: null })
  }

  down() {}
}

module.exports = ChangePlanForLandlordSchema
