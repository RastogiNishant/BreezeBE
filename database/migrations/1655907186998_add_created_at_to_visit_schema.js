'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AddCreatedAtToVisitSchema extends Schema {
  up() {
    this.table('visits', (table) => {
      // alter table
      table.timestamp('created_at').defaultTo(Database.fn.now())
    })
  }

  down() {}
}

module.exports = AddCreatedAtToVisitSchema
