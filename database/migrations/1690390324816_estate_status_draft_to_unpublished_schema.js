'use strict'

const {
  STATUS_DRAFT,
  PUBLISH_STATUS_APPROVED_BY_ADMIN,
  PUBLISH_STATUS_INIT,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class EstateStatusDraftToUnpublishedSchema extends Schema {
  async up() {
    await Estate.query()
      .where('status', STATUS_DRAFT)
      .where('publish_status', PUBLISH_STATUS_APPROVED_BY_ADMIN)
      .update({ publish_status: PUBLISH_STATUS_INIT })
  }

  down() {}
}

module.exports = EstateStatusDraftToUnpublishedSchema
