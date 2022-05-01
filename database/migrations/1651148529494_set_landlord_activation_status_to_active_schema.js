'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const { USER_ACTIVATION_STATUS_ACTIVATED } = require('../../app/constants')

class SetLandlordActivationStatusToActiveSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      await Database.raw(
        `update users set activation_status='${USER_ACTIVATION_STATUS_ACTIVATED}' ` +
          'where users.activation_status is null '
      )
    })
  }

  down() {
    this.schedule(async (trx) => {
      await Database.raw(
        `update users set activation_status=null ` +
          `where users.activation_status='${USER_ACTIVATION_STATUS_ACTIVATED}' `
      )
    })
  }
}

module.exports = SetLandlordActivationStatusToActiveSchema
