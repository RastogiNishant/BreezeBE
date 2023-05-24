'use strict'

const { STATUS_EXPIRE, STATUS_ACTIVE, STATUS_DRAFT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class AvailableStartAtNullToDraftSchema extends Schema {
  async up() {
    await Estate.query()
      .update({ status: STATUS_DRAFT })
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .whereNull('available_start_at')
  }

  down() {}
}

module.exports = AvailableStartAtNullToDraftSchema
