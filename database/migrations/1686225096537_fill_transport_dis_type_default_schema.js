'use strict'

const { TRANSPORT_TYPE_CAR } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const Tenant = use('App/Models/Tenant')

class FillTransportDisTypeDefaultSchema extends Schema {
  async up() {
    await Tenant.query().whereNull('dist_type').update({ dist_type: TRANSPORT_TYPE_CAR })
    await Tenant.query().whereNull('dist_min').update({ dist_min: 60 })
  }

  down() {}
}

module.exports = FillTransportDisTypeDefaultSchema
