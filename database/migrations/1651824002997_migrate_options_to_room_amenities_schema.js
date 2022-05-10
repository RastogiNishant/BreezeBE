'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Room = use('App/Models/Room')
const Database = use('Database')
const Promise = require('bluebird')

class MigrateOptionsToRoomAmenitiesSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      let rooms = await Room.query().whereNot('options', null).fetch()
      rooms = rooms.toJSON()
      await Promise.all(
        rooms.map(async (room) => {
          let options = room.options
          let room_id = room.id
          await options.map(async (option, index) => {
            await Database.insert({
              room_id,
              option_id: option,
              added_by: null,
              sequence_order: index + 1,
              type: 'amenity',
              created_at: new Date(),
              updated_at: new Date(),
            }).into('room_amenities')
          })
        })
      )
    })
  }

  down() {
    this.table('migrate_options_to_room_amenities', (table) => {
      // reverse alternations
    })
  }
}

module.exports = MigrateOptionsToRoomAmenitiesSchema
