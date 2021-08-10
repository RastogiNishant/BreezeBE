'use strict'

const Schema = use('Schema')

class ImageSchema extends Schema {
  up() {

    this.alter('images', (table) => {
      table.dropForeign('room_id')
    })

    this.alter('images', (table) => {
      table
        .integer('room_id')
        .unsigned()
        .references('id')
        .inTable('rooms')
        .onDelete('cascade')
        .alter()
    })
  }

  down() {}
}

module.exports = ImageSchema
