'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UsersAddVerifyFieldsSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.boolean('is_verified').defaultTo(false)
      table.integer('verified_by').unsigned().index()
      table.foreign('verified_by').references('id').on('users').onDelete('SET NULL')
      table.datetime('verified_date', { useTz: false })
    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('is_verified')
      table.dropColumn('verified_by')
      table.dropColumn('verified_date')
    })
  }
}

module.exports = UsersAddVerifyFieldsSchema
