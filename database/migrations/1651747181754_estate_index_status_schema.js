'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class EstateIndexStatusSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('status').index('estates_status_index').alter()
    })
  }

  down() {
    this.table('estates', async (table) => {
      // reverse alternations
      await Database.raw(`drop index estates_status_index`)
    })
  }
}

module.exports = EstateIndexStatusSchema
