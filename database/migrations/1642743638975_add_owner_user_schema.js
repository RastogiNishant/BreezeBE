'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOwnerUserSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.integer('owner_id').unsigned().references('id').inTable('users')      
    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('owner_id')      
    })
  }
}

module.exports = AddOwnerUserSchema
