'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const moment = require('moment')
const { DATE_FORMAT } = require('../../app/constants')

class AdjustInviteSentDateEstateCurrentTenantsSchema extends Schema {
  async up() {
    const date = moment.utc(new Date()).format(DATE_FORMAT)
    await EstateCurrentTenant.query().whereNotNull('code').whereNull('invite_sent_at').update({ invite_sent_at: date })
  }

  down() {
  }
}

module.exports = AdjustInviteSentDateEstateCurrentTenantsSchema
