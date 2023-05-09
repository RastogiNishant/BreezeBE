'use strict'

const { PETS_BIG, PETS_SMALL } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Tenant = use('App/Models/Tenant')

class AdjustTenantPetSchema extends Schema {
  async up() {
    await Tenant.query().where('pets', PETS_BIG).update({ pets: PETS_SMALL })
  }

  down() {}
}

module.exports = AdjustTenantPetSchema
