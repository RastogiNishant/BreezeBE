'use strict'

const { STATUS_DRAFT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusToBuildingsSchema extends Schema {
  up() {
    this.table('buildings', (table) => {
      // alter table
      table
        .integer('status')
        .comment('1-active, 2-deleted, 5-draft')
        .defaultTo(STATUS_DRAFT)
        .index()
    })
  }

  down() {
    this.table('buildings', (table) => {
      // reverse alternations
      table.dropColumn('status')
    })
  }
}

module.exports = AddStatusToBuildingsSchema
