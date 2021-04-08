'use strict'

const Schema = use('Schema')

const { ROOM_TYPE_GUEST_ROOM, STATUS_ACTIVE } = require('../../app/constants')

class RoomsSchema extends Schema {
  up() {
    /**
     *
     */
    this.create('rooms', (table) => {
      table.increments()
      table.integer('estate_id').unsigned().references('id').inTable('estates')
      table.integer('type').unsigned().defaultTo(ROOM_TYPE_GUEST_ROOM)
      table.integer('options').unsigned().defaultTo(0)
      table.decimal('area').defaultTo(0)
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.timestamps()
    })
  }

  down() {
    this.drop('rooms')
  }
}

module.exports = RoomsSchema
