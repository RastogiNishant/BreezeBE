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
  pull,
} = require('lodash')
const Event = use('Event')
const {
  STATUS_DELETE,
  STATUS_ACTIVE,
  ROLE_PROPERTY_MANAGER,
  PROPERTY_MANAGE_ALLOWED,
} = require('../constants')
const schema = require('../Validators/CreateRoom').schema()
const Promise = require('bluebird')
const Estate = use('App/Models/Estate')
const HttpException = use('App/Exceptions/HttpException')

class RoomService {
  /**
   *
   */
  static async getRoomByUser(userId, roomId) {
    return await Room.query()
      .select('rooms.*', '_e.cover')
      .with('images')
      .where('rooms.id', roomId)
      .innerJoin({ _e: 'estates' }, function () {
        if (isArray(userId)) {
          this.on('_e.id', 'rooms.estate_id').onIn('_e.user_id', userId)
        } else {
          this.on('_e.id', 'rooms.estate_id').on('_e.user_id', userId)
        }
      })
      .first()
  }

  static async getRoomIds(userId, roomIds) {
    return (
      await Room.query()
        .select('rooms.id')
        .whereIn('rooms.id', roomIds)
        .innerJoin({ _e: 'estates' }, function () {
          if (isArray(userId)) {
            this.on('_e.id', 'rooms.estate_id').onIn('_e.user_id', userId)
          } else {
            this.on('_e.id', 'rooms.estate_id').on('_e.user_id', userId)
          }
        })
        .fetch()
    ).rows
  }

  /**
   *
   */
  static async removeRoom(room, trx) {
    return await Room.query()
      .update({ name: `deleted_${new Date().getTime()}_${room.name}`, status: STATUS_DELETE })
      .where('id', room.id)
      .transacting(trx)
  }

  /**
   *
   */
  static async getRoomsByEstate(estateId, withImage = false) {
    const roomQuery = Room.query()
      .select('rooms.*')
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'rooms.estate_id')
      })
      .whereNot('_e.status', STATUS_DELETE)
      .where('rooms.estate_id', estateId)
    if (withImage) {
      roomQuery.with('images')
    }
    return await roomQuery.orderBy('rooms.order', 'asc').orderBy('rooms.id', 'asc').fetch()
  }

  /**
   *
   */
  static async addImage(url, room, disk, trx = null) {
    return Image.createItem({ url, disk, room_id: room.id }, trx)
  }

  /**
   *
   */
  static async removeImage(id, trx) {
    try {
      const image = await Image.findOrFail(id)
      await Drive.disk(image.disk).delete(image.url)
      await image.delete(trx)
      return image
    } catch (e) {
      return null
    }
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

  static async createRoomsFromImport(estate_id, rooms) {
    const roomsInfo = rooms.reduce((roomsInfo, room, index) => {
      return [...roomsInfo, { ...room, estate_id }]
    }, [])
    await Room.createMany(roomsInfo)
  }

  static async updateRoomsFromImport(estate_id, rooms) {
    let roomSequences = [1, 2, 3, 4, 5, 6]
    await Promise.all(
      rooms.map(async (room) => {
        let dRoom
        dRoom = await Room.query()
          .where('estate_id', estate_id)
          .where('import_sequence', room.import_sequence)
          .first()
        if (dRoom) {
          //update
          room.id = dRoom.id
          dRoom.fill(room)
          dRoom.status = STATUS_ACTIVE
          await dRoom.save()
          pull(roomSequences, parseInt(dRoom.import_sequence))
        } else {
          //create
          const newRoom = new Room()
          newRoom.fill(room)
          newRoom.estate_id = estate_id
          newRoom.status = STATUS_ACTIVE
          await newRoom.save()
          pull(roomSequences, parseInt(newRoom.import_sequence))
        }
      })
    )
    //we remove rooms that are not anymore on the import
    await Room.query()
      .whereIn('import_sequence', roomSequences)
      .where('estate_id', estate_id)
      .update({ status: STATUS_DELETE })
  }

  static async hasPermission(estate_id, user) {
    let userIds = [user.id]
    if (user.role === ROLE_PROPERTY_MANAGER) {
      userIds = await require('./EstatePermissionService').getLandlordIds(
        user.id,
        PROPERTY_MANAGE_ALLOWED
      )
    }
    await Estate.query().where('id', estate_id).whereIn('user_id', userIds).firstOrFail()
  }
}

module.exports = RoomService
