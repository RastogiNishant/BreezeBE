'use strict'

const {
  STATUS_ACTIVE,
  PUBLISH_STATUS_APPROVED_BY_ADMIN,
  PUBLISH_STATUS_BY_LANDLORD,
  PUBLISH_STATUS_INIT,
  STATUS_DELETE,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class PopulatePublishStatusEstateSchema extends Schema {
  async up() {
    await Database.raw(`Update estates as e set publish_status = 
        CASE 
          WHEN e1.status = ${STATUS_ACTIVE} THEN ${PUBLISH_STATUS_APPROVED_BY_ADMIN}
          WHEN e1.is_published is true AND e1.status <> ${STATUS_ACTIVE} THEN ${PUBLISH_STATUS_BY_LANDLORD}
          ELSE ${PUBLISH_STATUS_INIT}
        END
      FROM
        estates as e1
      WHERE
        e.id=e1.id
      AND
        e.status <> ${STATUS_DELETE}`)
  }

  down() {}
}

module.exports = PopulatePublishStatusEstateSchema
