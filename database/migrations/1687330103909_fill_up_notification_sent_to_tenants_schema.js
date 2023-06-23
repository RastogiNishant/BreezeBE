'use strict'

const { NOTICE_TYPE_TENANT_PROFILE_FILL_UP_ID } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Tenant = use('App/Models/Tenant')

class FillUpNotificationSentToTenantsSchema extends Schema {
  async up() {
    await Tenant.query().update({ notify_sent: [NOTICE_TYPE_TENANT_PROFILE_FILL_UP_ID] })
  }

  down() {}
}

module.exports = FillUpNotificationSentToTenantsSchema
