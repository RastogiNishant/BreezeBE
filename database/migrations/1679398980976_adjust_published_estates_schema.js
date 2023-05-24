'use strict'

const {
  STATUS_ACTIVE,
  STATUS_DRAFT,
  LETTING_TYPE_LET,
  STATUS_EXPIRE,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class AdjustPublishedEstatesSchema extends Schema {
  async up() {
    await Estate.query()
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .update({ is_published: true })
  }

  down() {}
}

module.exports = AdjustPublishedEstatesSchema
