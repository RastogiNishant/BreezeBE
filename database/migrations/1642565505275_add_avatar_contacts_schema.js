'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddAvatarContactsSchema extends Schema {
  up () {
    this.table('contacts', (table) => {
      // alter table
      table.string('avatar', 512)
    })
  }

  down () {
    this.table('contacts', (table) => {
      // reverse alternations
      table.dropColumn('avatar')      
    })
  }
}

module.exports = AddAvatarContactsSchema
