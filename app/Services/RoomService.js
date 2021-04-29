const Drive = use('Drive')
const Logger = use('Logger')
const Room = use('App/Models/Room')
const Image = use('App/Models/Image')

const { STATUS_DELETE } = require('../constants')

class RoomService {
  /**
   *
   */
  static async getRoomByUser(userId, roomId) {
    return Room.query()
      .select('rooms.*', '_e.cover')
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

  /**
   *
   */
  static async addImage(url, room, disk) {
    return Image.createItem({ url, disk, room_id: room.id })
  }

  /**
   *
   */
  static async removeImage(id) {
    const image = await Image.findOrFail(id)
    try {
      await Drive.disk(image.disk).delete(image.url)
    } catch (e) {
      Logger.error(e.message)
    }
    await image.delete()
  }
}

module.exports = RoomService
