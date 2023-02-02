'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEstateIdToNoticesSchema extends Schema {
  up() {
    this.table('notices', (table) => {
      // alter table
      table.integer('estate_id').unsigned().references('id').inTable('estates')
      table.index('estate_id')
      table.index('user_id')
    })
  }

  down() {
    this.table('notices', (table) => {
      // reverse alternations
      table.dropColumn('estate_id')
      table.dropIndex('estate_id')
      table.dropIndex('user_id')
    })
  }
}

module.exports = AddEstateIdToNoticesSchema
