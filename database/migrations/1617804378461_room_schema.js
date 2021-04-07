'use strict'

const Schema = use('Schema')

class RoomSchema extends Schema {
  up() {
    this.alter('rooms', (table) => {
      table.string('name', 255)
    })
  }

  down() {
    this.table('rooms', (table) => {
      table.dropColumn('name')
    })
  }
}

module.exports = RoomSchema
