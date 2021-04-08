const Database = use('Database')
const Room = use('App/Models/Room')

const { STATUS_DELETE } = require('../constants')

class RoomService {
  /**
   *
   */
  static async getRoomByUser(userId, roomId) {
    return Room.query()
      .select('rooms.*')
      .where('rooms.id', roomId)
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'rooms.estate_id').on('_e.user_id', userId)
      })
      .first()
  }

  /**
   *
   */
  static async removeRoom(roomId) {
    return Room.query().update({ status: STATUS_DELETE }).where('id', roomId)
  }

  /**
   *
   */
  static async getRoomsByEstate(estateId) {
    return Room.query()
      .where('estate_id', estateId)
      .whereNot('status', STATUS_DELETE)
      .orderBy('id', 'ask')
      .fetch()
  }
}

module.exports = RoomService
