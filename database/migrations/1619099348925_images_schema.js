'use strict'

const Schema = use('Schema')

class ImagesSchema extends Schema {
  up() {
    this.create('images', (table) => {
      table.increments()
      table.string('url', 254)
      table.integer('room_id').unsigned().references('id').inTable('rooms')
      table.string('disk', 10)
    })

    this.table('rooms', (table) => {
      table.dropColumn('images')
    })
  }

  down() {
    this.drop('images')

    this.table('rooms', (table) => {
      table.json('images')
    })
  }
}

module.exports = ImagesSchema
