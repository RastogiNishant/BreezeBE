'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPublishStatusEstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table
        .integer('publish_status')
        .defaultTo(0)
        .comment(
          `PUBLISH_STATUS_INIT: 0, PUBLISH_STATUS_BY_LANDLORD: 1, PUBLISH_STATUS_APPROVED_BY_ADMIN: 2,PUBLISH_STATUS_DECLINED_BY_ADMIN: 3,`
        )
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('publish_status')
    })
  }
}

module.exports = AddPublishStatusEstateSchema
