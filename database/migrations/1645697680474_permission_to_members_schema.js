'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class PermissionToMembersSchema extends Schema {
  up () {
    this.create('member_permissions', (table) => {
      table.increments()      
      table.integer('member_id').unsigned().references('id').inTable('members')
      // One adult sees another user's profile.
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down () {
    this.drop('member_permissions')
  }
}

module.exports = PermissionToMembersSchema
