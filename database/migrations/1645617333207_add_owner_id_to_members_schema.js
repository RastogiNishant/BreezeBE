'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOwnerIdToMembersSchema extends Schema {
  up () {
    this.table('members', (table) => {
      // alter table
      table.integer('owner_user_id').unsigned().references('id').inTable('users')      
    })
  }

  down () {
    this.table('members', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddOwnerIdToMembersSchema