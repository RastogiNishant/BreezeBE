'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AddSmsCodeMemberSchema extends Schema {
  up () {
    this.table('members', (table) => {
      // alter table
      table.string('code', 20)
      table.boolean('is_verified').defaultTo(false)
      table.timestamp('published_at', { precision: 3 })
    })
  }

  down () {
    this.table('members', (table) => {
      // reverse alternations
      table.dropColumn('code')
      tabole.dropColumn('is_verified')
      table.dropColumn('published_at')      
    })
  }
}

module.exports = AddSmsCodeMemberSchema
