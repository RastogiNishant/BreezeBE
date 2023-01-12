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
  groupBy,
  countBy,
  filter,
} = require('lodash')
const Event = use('Event')
const {
  STATUS_DELETE,
  STATUS_ACTIVE,
  ROLE_PROPERTY_MANAGER,
  PROPERTY_MANAGE_ALLOWED,
  ROOM_DEFAULT_ORDER,

  ROOM_TYPE_GUEST_ROOM,
  ROOM_TYPE_BATH,
  ROOM_TYPE_BEDROOM,
  ROOM_TYPE_KITCHEN,
  ROOM_TYPE_CORRIDOR,
  ROOM_TYPE_OFFICE,
  ROOM_TYPE_PANTRY,
  ROOM_TYPE_CHILDRENS_ROOM,
  ROOM_TYPE_BALCONY,
  ROOM_TYPE_WC,
  ROOM_TYPE_OTHER_SPACE,
  ROOM_TYPE_CHECKROOM,
  ROOM_TYPE_DINING_ROOM,
  ROOM_TYPE_ENTRANCE_HALL,
  ROOM_TYPE_GYM,
  ROOM_TYPE_IRONING_ROOM,
  ROOM_TYPE_LIVING_ROOM,
  ROOM_TYPE_LOBBY,
  ROOM_TYPE_MASSAGE_ROOM,
  ROOM_TYPE_STORAGE_ROOM,
  ROOM_TYPE_PLACE_FOR_GAMES,
  ROOM_TYPE_SAUNA,
  ROOM_TYPE_SHOWER,
  ROOM_TYPE_STAFF_ROOM,
  ROOM_TYPE_SWIMMING_POOL,
  ROOM_TYPE_TECHNICAL_ROOM,
  ROOM_TYPE_TERRACE,
  ROOM_TYPE_WASHING_ROOM,
  ROOM_TYPE_EXTERNAL_CORRIDOR,
  ROOM_TYPE_STAIRS,
  ROOM_TYPE_GARDEN,
  ROOM_TYPE_LOGGIA,
} = require('../constants')
const schema = require('../Validators/CreateRoom').schema()
const Promise = require('bluebird')
const uuid = require('uuid')
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
      .update({ name: `deleted_${uuid.v4()}_${room.name}`, status: STATUS_DELETE })
      .where('id', room.id)
      .transacting(trx)
  }

  static async removeAllRoom(estate_id, trx) {
    return await Room.query()
      .where('estate_id', estate_id)
      .update({ name: `deleted_${uuid.v4()}`, status: STATUS_DELETE })
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

  static async createRoomsFromImport({ estate_id, rooms }, trx) {
    const roomsInfo = rooms.reduce((roomsInfo, room, index) => {
      return [...roomsInfo, { ...room, estate_id }]
    }, [])

    const groupRooms = groupBy(roomsInfo, (room) => room.type)
    const newRoomsInfo = []
    Object.keys(groupRooms).map((key) => {
      groupRooms[key].map((room, index) => {
        newRoomsInfo.push({
          ...room,
          name: index ? `${room.name} ${index + 1}` : room.name,
          import_sequence: null,
          order: index + 1,
        })
      })
    })
    if (newRoomsInfo && newRoomsInfo.length) {
      newRoomsInfo[0].favorite = true
    }
    await Promise.map(newRoomsInfo, async (roomInfo) => {
      await Room.createItem(roomInfo, trx)
    })
  }

  static async updateRoomsFromImport({ estate_id, rooms }, trx) {
    const oldRooms =
      (
        await Room.query()
          .with('images')
          .where('estate_id', estate_id)
          .whereNot('status', STATUS_DELETE)
          .orderBy('order', 'asc')
          .fetch()
      ).toJSON() || []
    if (!oldRooms.length) {
      this.createRoomsFromImport({ estate_id, rooms }, trx)
    } else {
      const roomTypes = [
        ROOM_TYPE_GUEST_ROOM,
        ROOM_TYPE_BATH,
        ROOM_TYPE_BEDROOM,
        ROOM_TYPE_KITCHEN,
        ROOM_TYPE_CORRIDOR,
        ROOM_TYPE_OFFICE,
        ROOM_TYPE_PANTRY,
        ROOM_TYPE_CHILDRENS_ROOM,
        ROOM_TYPE_BALCONY,
        ROOM_TYPE_WC,
        ROOM_TYPE_OTHER_SPACE,
        ROOM_TYPE_CHECKROOM,
        ROOM_TYPE_DINING_ROOM,
        ROOM_TYPE_ENTRANCE_HALL,
        ROOM_TYPE_GYM,
        ROOM_TYPE_IRONING_ROOM,
        ROOM_TYPE_LIVING_ROOM,
        ROOM_TYPE_LOBBY,
        ROOM_TYPE_MASSAGE_ROOM,
        ROOM_TYPE_STORAGE_ROOM,
        ROOM_TYPE_PLACE_FOR_GAMES,
        ROOM_TYPE_SAUNA,
        ROOM_TYPE_SHOWER,
        ROOM_TYPE_STAFF_ROOM,
        ROOM_TYPE_SWIMMING_POOL,
        ROOM_TYPE_TECHNICAL_ROOM,
        ROOM_TYPE_TERRACE,
        ROOM_TYPE_WASHING_ROOM,
        ROOM_TYPE_EXTERNAL_CORRIDOR,
        ROOM_TYPE_STAIRS,
        ROOM_TYPE_GARDEN,
        ROOM_TYPE_LOGGIA,
      ]

      const oldRoomsByRoomTypes = roomTypes.map((type) =>
        filter(oldRooms, (room) => room.type === type)
      )

      const roomsInfo = rooms.reduce((roomsInfo, room, index) => {
        return [...roomsInfo, { ...room, estate_id }]
      }, [])

      const newRoomsByRoomTypes = roomTypes.map((type) =>
        filter(roomsInfo, (room) => room.type === type)
      )

      const differentRooms = newRoomsByRoomTypes.map((newRoomByType, index) => {
        if (newRoomByType.length > oldRoomsByRoomTypes[index].length) {
          return {
            operation: 'add',
            nameIndex: oldRoomsByRoomTypes[index].length,
            orderIndex: oldRoomsByRoomTypes[index][oldRoomsByRoomTypes[index].length - 1].order,
            rooms: newRoomByType.slice(oldRoomsByRoomTypes[index].length, newRoomByType.length),
          }
        } else if (newRoomByType.length < oldRoomsByRoomTypes[index].length) {
          const oldRoomsNoImages =
            oldRoomsByRoomTypes[index].filter((or) => !or.images?.length) || []
          return { operation: 'delete', roomIds: oldRoomsNoImages.map((r) => r.id) }
        }
        return {}
      })

      const addRooms = []
      let deleteRoomIds = []
      differentRooms.map((element) => {
        if (element && element.operation === 'add') {
          element.rooms.map((room, index) => {
            addRooms.push({
              ...room,
              name: element.nameIndex ? `${room.name} ${element.nameIndex + 1 + index}` : room.name,
              import_sequence: null,
              order:
                element.orderIndex === ROOM_DEFAULT_ORDER
                  ? ROOM_DEFAULT_ORDER
                  : element.orderIndex + index,
            })
          })
        } else if (element && element.operation === 'delete') {
          deleteRoomIds = deleteRoomIds.concat(element.roomIds)
        }
      })

      if (deleteRoomIds && deleteRoomIds.length) {
        await Room.query()
          .whereIn('id', deleteRoomIds)
          .update({ name: `deleted_${uuid.v4()}`, status: STATUS_DELETE })
          .transacting(trx)
      }

      if (addRooms && addRooms.length) {
        await Room.createMany(addRooms, trx)
      }
    }
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
