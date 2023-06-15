'use strict'

const { PUBLISH_TYPE_ONLINE_MARKET } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPublishTypeEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table
        .integer('publish_type')
        .defaultTo(PUBLISH_TYPE_ONLINE_MARKET)
        .comment('1: publishing online market, 2: publishing offline market')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('publish_type')
    })
  }
}

module.exports = AddPublishTypeEstatesSchema
