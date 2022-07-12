'use strict'

const { USER_ACTIVATION_STATUS_NOT_ACTIVATED } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

const Database = use('Database')

class UpdateActivationStatusOfLandlordsSchema extends Schema {
  async up() {
    await Database.raw(
      `update users set activation_status = ${USER_ACTIVATION_STATUS_NOT_ACTIVATED} where role = 1 and activation_status is null`
    )
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = UpdateActivationStatusOfLandlordsSchema
