'use strict'

const { PUBLISH_STATUS_INIT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPublishedInBuildingsSchema extends Schema {
  up() {
    this.table('buildings', (table) => {
      // alter table
      table.integer('published').defaultTo(PUBLISH_STATUS_INIT)
    })
  }

  down() {
    this.table('buildings', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddPublishedInBuildingsSchema
