'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UsersSourceEstateId extends Schema {
  up() {
    this.table('users', (table) => {
      table.integer('source_estate_id').unsigned().nullable().references('id').inTable('estates')
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropColumn('source_estate_id')
    })
  }
}

module.exports = UsersSourceEstateId
