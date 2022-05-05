'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RoomCustomAmenitiesSchema extends Schema {
  up() {
    this.create('room_custom_amenities', (table) => {
      table.increments()
      table.timestamps()
      table.integer('room_id').references('id').inTable('rooms')
      table.integer('status').defaultTo(STATUS_ACTIVE)
      table.string('amenity', 22)
      table.integer('sequence_order')
      table.integer('added_by').references('id').inTable('users')
    })
  }

  down() {
    this.drop('room_custom_amenities')
  }
}

module.exports = RoomCustomAmenitiesSchema
