'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFavoriteToRoomSchema extends Schema {
  up () {
    this.table('rooms', (table) => {
      // alter table
      table.boolean('favorite').defaultTo(false)      
    })
  }

  down () {
    this.table('rooms', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddFavoriteToRoomSchema
