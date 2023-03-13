'use strict'

const { MAXIMUM_EXPIRE_PERIOD } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddAvailDurationToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('online_end_option')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('online_end_option')
    })
  }
}

module.exports = AddAvailDurationToEstatesSchema
