'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RoomAmenitiesSchema extends Schema {
  up() {
    this.create('room_amenities', (table) => {
      table.increments()
      table.integer('room_id').references('id').inTable('rooms')
      table.integer('option_id').references('id').inTable('options').nullable()
      table.integer('status').defaultTo(STATUS_ACTIVE).index()
      table.string('amenity', 22).nullable()
      table.enu('type', ['amenity', 'custom_amenity'])
      table.integer('sequence_order')
      table.integer('added_by').references('id').inTable('users').nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('room_amenities')
  }
}

module.exports = RoomAmenitiesSchema
