'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIndexToUserEmailSchema extends Schema {
  up () {
    this.alter('users', (table) => {
      // alter table
      table.index(['email'], 'email_index')
    })
  }

  down () {
    this.alter('users', (table) => {
      // alter table
      table.dropIndex(['email'], 'email_index')
    })
  }
}

module.exports = AddIndexToUserEmailSchema
