'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusColumnEstateSyncTargetSchema extends Schema {
  up() {
    this.table('estate_sync_targets', (table) => {
      // alter table
      table.integer('status').defaultTo(1).comment('1 means active, 2 means deleted')
    })
  }

  down() {
    this.table('estate_sync_targets', (table) => {
      table.dropColumn('status')
    })
  }
}

module.exports = AddStatusColumnEstateSyncTargetSchema
