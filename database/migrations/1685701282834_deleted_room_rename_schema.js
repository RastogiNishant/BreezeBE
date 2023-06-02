'use strict'

const { STATUS_DELETE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Room = use('App/Models/Room')
const Database = use('Database')
const RoomService = use('App/Services/RoomService')
const Promise = require('bluebird')
class DeletedRoomRenameSchema extends Schema {
  async up() {
    const deletedRooms = (
      await Room.query()
        .where('status', STATUS_DELETE)
        .whereNot('name', 'ilike', '%deleted%')
        .fetch()
    ).toJSON()

    const trx = await Database.beginTransaction()
    try {
      await Promise.map(
        deletedRooms || [],
        async (deleteRoom) => {
          await RoomService.removeRoom(deleteRoom, trx)
        },
        { concurrency: 1 }
      )
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }

  down() {}
}

module.exports = DeletedRoomRenameSchema
