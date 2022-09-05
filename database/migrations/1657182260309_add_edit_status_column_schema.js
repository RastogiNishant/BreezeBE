'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEditStatusColumnSchema extends Schema {
  up() {
    this.table('chats', (table) => {
      // alter table
      table.enum('edit_status', ['unedited', 'edited', 'deleted']).default('unedited')
    })
  }

  down() {
    this.table('chats', (table) => {
      // reverse alternations
      table.dropColumn('edit_status')
    })
  }
}

module.exports = AddEditStatusColumnSchema
