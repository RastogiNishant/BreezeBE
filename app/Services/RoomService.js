const Room = use('App/Models/Room')
const Image = use('App/Models/Image')
const File = use('App/Classes/File')
const Database = use('Database')
const QueueService = use('App/Services/QueueService')
const { reduce, isArray, omit, pick, assign, groupBy, filter } = require('lodash')
const Event = use('Event')
const {
  STATUS_DELETE,
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
  ROOM_TYPE_PROPERTY_ENTRANCE,
  ROOM_TYPE_STAIRS,
  ROOM_TYPE_GARDEN,
  ROOM_TYPE_LOGGIA,
  FILE_LIMIT_LENGTH,
} = require('../constants')
const {
  exceptions: {
    NO_ROOM_EXIST,
    NO_IMAGE_EXIST,
    IMAGE_COUNT_LIMIT,
    INVALID_ROOM,
    FAILED_TO_ADD_FILE,
    CURRENT_IMAGE_COUNT,
  },
} = require('../exceptions')

const schema = require('../Validators/CreateRoom').schema()
const Promise = require('bluebird')
const uuid = require('uuid')
const Estate = use('App/Models/Estate')
const HttpException = use('App/Exceptions/HttpException')

class RoomService {
  /**
   *
   */
  static async getRoomByUser({ userIds, room_id, estate_id = null }) {
    return await Room.query()
      .select('rooms.*', '_e.cover')
      .with('images')
      .where('rooms.id', room_id)
      .innerJoin({ _e: 'estates' }, function () {
        if (estate_id) {
          this.on('_e.id', estate_id)
        }
        if (isArray(userIds)) {
          this.on('_e.id', 'rooms.estate_id').onIn('_e.user_id', userIds)
        } else {
          this.on('_e.id', 'rooms.estate_id').on('_e.user_id', userIds)
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
    await Room.query()
      .update({ name: `deleted_${uuid.v4()}_${room.name}`, status: STATUS_DELETE })
      .where('id', room.id)
      .transacting(trx)
  }

  static async handleRemoveRoom(room, trx) {
    await this.removeRoom(room, trx)
    await this.reIndexRooms(
      { estate_id: room.estate_id, type: room.type, deleteIds: [room.id] },
      trx
    )
  }

  static async reIndexRooms({ estate_id, type, deleteIds = null }, trx) {
    let rooms = await Room.query()
      .where('estate_id', estate_id)
      .where('type', type)
      .whereNot('status', STATUS_DELETE)
      .fetch()
    if (deleteIds) {
      rooms = (rooms.toJSON() || []).filter((r) => !deleteIds.includes(r.id))
    }
    const groupRooms = groupBy(rooms, (room) => room.type)
    const updateRooms = []
    Object.keys(groupRooms).map((key) => {
      groupRooms[key].map((room, index) => {
        const name = room.name.split(' ')[0]
        updateRooms.push({
          ...room,
          name: index ? `${name} ${index}` : name,
        })
      })
    })

    await Promise.all(
      updateRooms.map(async (room) => {
        await Room.query().where('id', room.id).update({ name: room.name }).transacting(trx)
      })
    )
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
        this.on('_e.id', 'rooms.estate_id').onNotIn('_e.status', [STATUS_DELETE])
      })
      .whereNot('rooms.status', STATUS_DELETE)
      .where('rooms.estate_id', estateId)
    if (withImage) {
      roomQuery.with('images')
    }
    return await roomQuery.orderBy('rooms.order', 'asc').orderBy('rooms.id', 'asc').fetch()
  }

  static async addRoomPhoto(request, { user, room_id }) {
    const userIds = [user.id]
    if (user.role === ROLE_PROPERTY_MANAGER) {
      userIds = await require('./EstatePermissionService').getLandlordIds(
        user.id,
        PROPERTY_MANAGE_ALLOWED
      )
    }

    const room = await this.getRoomByUser({ userIds, room_id })
    if (!room) {
      throw new HttpException(INVALID_ROOM, 404)
    }

    const count = File.filesCount(request, 'file')
    const image_length = room.toJSON().images?.length || 0

    if (room.toJSON().images && image_length + count > FILE_LIMIT_LENGTH) {
      throw new HttpException(`${IMAGE_COUNT_LIMIT} ${CURRENT_IMAGE_COUNT}:${image_length}`, 400)
    }

    const trx = await Database.beginTransaction()
    try {
      const imageMimes = [
        File.IMAGE_JPEG,
        File.IMAGE_PNG,
        File.IMAGE_TIFF,
        File.IMAGE_WEBP,
        File.IMAGE_HEIC,
        File.IMAGE_GIF,
      ]
      const files = await File.saveRequestFiles(request, [
        { field: 'file', mime: imageMimes, isPublic: true },
      ])

      if (files && files.file) {
        const paths = Array.isArray(files.file) ? files.file : [files.file]
        const original_file_names = Array.isArray(files.original_file)
          ? files.original_file
          : [files.original_file]
        const data = paths.map((path, index) => {
          return {
            disk: 's3public',
            url: path,
            file_name: original_file_names[index],
            room_id: room.id,
          }
        })
        const images = await this.addManyImages(data, trx)
        console.log('Room Images=', images)
        await require('./EstateService').updateCover(
          { room: room.toJSON(), addImage: images[0] },
          trx
        )
        Event.fire('estate::update', room.estate_id)
        await trx.commit()
        return images
      } else {
        throw new HttpException(FAILED_TO_ADD_FILE, 500)
      }
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  static async addImage({ url, file_name, room, disk }, trx = null) {
    return Image.createItem({ url, file_name, disk, room_id: room.id }, trx)
  }

  static async addManyImages(data, trx = null) {
    return Image.createMany(data, trx)
  }

  /**
   *
   */
  static async removeImage(id, trx) {
    try {
      const image = await Image.findOrFail(id)

      //await Drive.disk(image.disk).delete(image.url)
      await image.delete(trx)
      return image
    } catch (e) {
      throw new HttpException(NO_IMAGE_EXIST, 400)
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

  static async createRoom({ user, estate_id, roomData }, trx) {
    await this.hasPermission(estate_id, user)

    if (roomData.favorite) {
      await Room.query()
        .where('estate_id', estate_id)
        .where('type', roomData.type)
        .update({ favorite: false })
        .transacting(trx)
    }

    const room = await Room.createItem(
      {
        ...roomData,
        estate_id,
      },
      trx
    )

    return room
  }
  static async createRoomsFromImport({ estate_id, rooms }, trx) {
    try {
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
      await Room.createMany(newRoomsInfo, trx)
    } catch (e) {
      throw new HttpException(e.message, e.status || 500)
    }
  }

  static async updateRoomsFromImport({ estate_id, rooms }, trx) {
    try {
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
        await this.createRoomsFromImport({ estate_id, rooms }, trx)
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
          ROOM_TYPE_PROPERTY_ENTRANCE,
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
            const oldRoomLength = oldRoomsByRoomTypes[index].length
            return {
              operation: 'add',
              nameIndex: oldRoomsByRoomTypes[index].length,
              orderIndex: oldRoomLength
                ? oldRoomsByRoomTypes[index][oldRoomLength - 1].order
                : ROOM_DEFAULT_ORDER,
              rooms: newRoomByType.slice(oldRoomsByRoomTypes[index].length, newRoomByType.length),
            }
          } else if (newRoomByType.length < oldRoomsByRoomTypes[index].length) {
            const oldRoomsNoImages =
              oldRoomsByRoomTypes[index].filter((or) => !or.images?.length) || []
            return {
              operation: 'delete',
              type: oldRoomsByRoomTypes[index][0].type,
              rooms: oldRoomsNoImages.map((r) => {
                return { id: r.id, name: r.name }
              }),
            }
          }
          return {}
        })

        const addRooms = []
        let deleteRoomIdsByType = []
        differentRooms.map((element) => {
          if (element && element.operation === 'add') {
            element.rooms.map((room, index) => {
              addRooms.push({
                ...room,
                name: element.nameIndex
                  ? `${room.name} ${element.nameIndex + 1 + index}`
                  : room.name,
                import_sequence: null,
                order:
                  element.orderIndex === ROOM_DEFAULT_ORDER
                    ? ROOM_DEFAULT_ORDER
                    : element.orderIndex + index,
              })
            })
          } else if (element && element.operation === 'delete') {
            deleteRoomIdsByType.push(element)
          }
        })

        if (deleteRoomIdsByType && deleteRoomIdsByType.length) {
          await Promise.map(deleteRoomIdsByType, async (dr) => {
            await Promise.map(dr.rooms, async (r) => {
              await Room.query()
                .where('id', r.id)
                .update({ name: `deleted_${uuid.v4()}_${r.name}`, status: STATUS_DELETE })
                .transacting(trx)
            })
            await this.reIndexRooms(
              { estate_id, type: dr.type, deleteIds: dr.rooms.map((r) => r.id) },
              trx
            )
          })
        }

        if (addRooms && addRooms.length) {
          await Room.createMany(addRooms, trx)
        }
      }
    } catch (e) {
      console.log('update room error', e.message)
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

  static async addImageFromGallery({ user_id, room_id, estate_id, galleries, room }, trx) {
    if (!room) {
      room = await this.getRoomByUser({ userIds: user_id, room_id, estate_id })
      if (!room) {
        throw new HttpException(NO_ROOM_EXIST, 400)
      }
    }

    if (
      room.images &&
      (room.toJSON().images?.length || 0) + (galleries?.length || 0) > FILE_LIMIT_LENGTH
    ) {
      throw new HttpException(IMAGE_COUNT_LIMIT, 400)
    }

    const imagesInfo = []
    const images =
      galleries.filter((gallery) =>
        File.SUPPORTED_IMAGE_FORMAT.some((format) => gallery.url.indexOf(format) >= 0)
      ) || []

    images.map((image) => {
      imagesInfo.push({
        url: image.url,
        file_name: image.file_name,
        room_id: room.id,
        disk: 's3public',
      })
    })

    if (imagesInfo) {
      await Image.createMany(imagesInfo, trx)
    }

    return images.map((image) => image.id)
  }
}

module.exports = RoomService
