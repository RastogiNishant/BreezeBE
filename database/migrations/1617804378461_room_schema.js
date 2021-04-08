'use strict'

const Schema = use('Schema')

class RoomSchema extends Schema {
  up() {
    this.alter('rooms', (table) => {
      table.string('name', 255)
      table.json('images')
      table.integer('cover')
    })
  }

  down() {
    this.table('rooms', (table) => {
      table.dropColumn('name')
      table.dropColumn('images')
      table.dropColumn('cover')
    })
  }
}

module.exports = RoomSchema
