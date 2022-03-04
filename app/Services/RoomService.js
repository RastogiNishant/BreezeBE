const Drive = use('Drive')
const Logger = use('Logger')
const Room = use('App/Models/Room')
const Image = use('App/Models/Image')
const QueueService = use('App/Services/QueueService')
const {
  get,
  has,
  trim,
  isEmpty,
  reduce,
  isString,
  isArray,
  isFunction,
  omit,
  pick,
  assign,
} = require('lodash')
const Event = use('Event')
const { STATUS_DELETE } = require('../constants')
const schema = require('../Validators/CreateRoom').schema()

class RoomService {
  /**
   *
   */
  static async getRoomByUser(userId, roomId) {
    return Room.query()
      .select('rooms.*', '_e.cover')
      .where('rooms.id', roomId)
      .innerJoin({ _e: 'estates' }, function () {
        if( isArray(userId)){
          this.on('_e.id', 'rooms.estate_id').onIn('_e.user_id', userId)          
        }else{
          this.on('_e.id', 'rooms.estate_id').on('_e.user_id', userId)  
        }

      })
      .first()
  }

  static async getRoomIds( userId, roomIds) {
    return (await Room.query()
      .select('rooms.id')
      .whereIn('rooms.id', roomIds)
      .innerJoin({ _e: 'estates' }, function () {
        if( isArray(userId)){
          this.on('_e.id', 'rooms.estate_id').onIn('_e.user_id', userId)          
        }else{
          this.on('_e.id', 'rooms.estate_id').on('_e.user_id', userId)  
        }
      })
      .fetch()).rows
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
      .orderBy('order','asc')
      .orderBy('id','asc')
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

  /**
   * Function to create bulk rooms from cell from excel
   *
   */
  static async createBulkRooms(estate_id, data) {
    let roomsWithPhotos = RoomService.extractBulkData(estate_id, data)
    const columns = Room.columns

    if (roomsWithPhotos && roomsWithPhotos.length) {
      const rooms = await Promise.all(
        roomsWithPhotos.map(async (rp) => {
          const room = omit(pick(rp, columns || []), ['photos'])
          await schema.validate(room)
          return room
        })
      )

      const ret = await Room.createMany(rooms)
      const images = roomsWithPhotos.map((rp, index) =>
        assign(pick(rp, ['photos']), { room_id: ret[index]['id'] })
      )
      // Separately run task to save images for rooms
      QueueService.savePropertyBulkImages(images)
//ImageService.savePropertyBulkImages(images)
    }
  }

  /**
   *
   * @param {*} data : cell data from excel
   */
  static extractBulkData = (estate_id, data) => {
    const rooms = []
    for (let i = 0; i < 6; i++) {
      let room = {}

      reduce(data, (n, v, k) => {
        if (k.includes(`room${i + 1}`)) {
          const keys = k.split('_')
          if (keys && keys.length === 2) {
            if (keys[1] === 'photos') {
              v = v.replace(/\r/g, '').replace(/\n/, '').trim()
              v = v.split(',')
            }
            room[keys[1]] = v
          }
        }
      })

      if (room.type !== undefined) {
        room = {
          ...room,
          estate_id,
        }
        rooms.push(room)
      }
    }
    return rooms
  }
}

module.exports = RoomService
