'use strict'

const Logger = use('Logger')
const Database = use('Database')
const Event = use('Event')
const Room = use('App/Models/Room')
const File = use('App/Classes/File')
const HttpException = use('App/Exceptions/HttpException')
const RoomService = use('App/Services/RoomService')
const EstatePermissionService = use('App/Services/EstatePermissionService')
const EstateService = use('App/Services/EstateService')
const GalleryService = use('App/Services/GalleryService')
const {
  PROPERTY_MANAGE_ALLOWED,
  ROLE_PROPERTY_MANAGER,
  STATUS_DELETE,
  FILE_LIMIT_LENGTH,
} = require('../../constants')
const {
  exceptions: { IMAGE_COUNT_LIMIT },
} = require('../../exceptions')
const ImageService = require('../../Services/ImageService')

class RoomController {
  /**
   *
   */

  async createBulkRoom({ request, auth, response }) {
    const { estate_id, rooms } = request.all()
    const trx = await Database.beginTransaction()
    const newRooms = []
    try {
      await RoomService.hasPermission(estate_id, auth.user)

      await Promise.all(
        rooms.map(async (r) => {
          if (r.favorite) {
            await Room.query()
              .where('estate_id', estate_id)
              .where('type', r.type)
              .update({ favorite: false })
              .transacting(trx)
          }
          const room = await Room.createItem(
            {
              ...r,
              estate_id,
            },
            trx
          )
          newRooms.push(room)
        })
      )
      Event.fire('estate::update', estate_id)
      await trx.commit()
      response.res(newRooms)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 500)
    }
  }

  async createRoom({ request, auth, response }) {
    const { estate_id, ...roomData } = request.all()

    const trx = await Database.beginTransaction()

    try {
      await RoomService.hasPermission(estate_id, auth.user)

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

      Event.fire('estate::update', estate_id)
      await trx.commit()

      response.res(room)
    } catch (e) {
      Logger.error('Create Room error', e)
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async updateRoom({ request, auth, response }) {
    const { estate_id, room_id, ...data } = request.all()
    // Get room and check estate owner

    let userIds = [auth.user.id]
    if (auth.user.role === ROLE_PROPERTY_MANAGER) {
      userIds = await EstatePermissionService.getLandlordIds(auth.user.id, PROPERTY_MANAGE_ALLOWED)
    }

    const room = await RoomService.getRoomByUser({ userIds, room_id })
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }
    const trx = await Database.beginTransaction()
    try {
      if (data.favorite) {
        await Room.query()
          .where('estate_id', estate_id)
          .update({ favorite: false })
          .transacting(trx)
      }

      room.merge(data)
      await room.save(trx)

      await EstateService.updateCover({ room: room.toJSON() }, trx)

      Event.fire('estate::update', estate_id)
      await trx.commit()

      response.res(room)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }
  }
  /**
   *
   */
  async removeRoom({ request, auth, response }) {
    const { room_id } = request.all()
    const room = await RoomService.getRoomByUser({ userIds: auth.user.id, room_id })
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }

    const trx = await Database.beginTransaction()
    try {
      await RoomService.handleRemoveRoom(room, trx)
      await EstateService.updateCover({ room: room.toJSON() }, trx)
      Event.fire('estate::update', room.estate_id)
      await trx.commit()

      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  async updateOrder({ request, auth, response }) {
    const { ids } = request.all()
    const roomIds = await RoomService.getRoomIds(auth.user.id, ids)
    if (roomIds.length != ids.length) {
      throw new HttpException("Some roomids don't exist")
    }

    await Promise.all(
      ids.map(async (id, index) => {
        await Room.query()
          .where('id', id)
          .update({ order: index + 1 })
      })
    )

    response.res(true)
  }

  async orderRoomPhoto({ request, auth, response }) {
    const { room_id, ids } = request.all()
    const room = await RoomService.getRoomByUser({ userIds: auth.user.id, room_id })
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }

    const trx = await Database.beginTransaction()

    try {
      const images = (await ImageService.getImagesByRoom(room_id, ids)).toJSON()
      if (!images || images.length != ids.length) {
        throw new HttpException("Some imageIds don't exist")
      }

      await ImageService.updateOrder(ids, trx)
      await EstateService.changeEstateCoverInFavorite(room, images, ids[0], trx)
      await trx.commit()
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }
  /**
   *
   */
  async addRoomPhoto({ request, auth, response }) {
    const { room_id } = request.all()

    let userIds = [auth.user.id]
    if (auth.user.role === ROLE_PROPERTY_MANAGER) {
      userIds = await EstatePermissionService.getLandlordIds(auth.user.id, PROPERTY_MANAGE_ALLOWED)
    }

    const room = await RoomService.getRoomByUser({ userIds, room_id })
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }

    if (room.toJSON().images && room.toJSON().images.length >= FILE_LIMIT_LENGTH) {
      throw new HttpException(IMAGE_COUNT_LIMIT, 400)
    }

    const trx = await Database.beginTransaction()
    try {
      const imageMimes = [File.IMAGE_JPEG, File.IMAGE_PNG]
      const files = await File.saveRequestFiles(request, [
        { field: 'file', mime: imageMimes, isPublic: true },
      ])

      const image = await RoomService.addImage(
        {
          url: files.file,
          file_name: files.original_file,
          room,
          disk: 's3public',
        },
        trx
      )

      await EstateService.updateCover({ room: room.toJSON(), addImage: image }, trx)

      Event.fire('estate::update', room.estate_id)

      await trx.commit()
      response.res(image)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async removeRoomPhoto({ request, auth, response }) {
    const { room_id, id } = request.all()
    const room = await RoomService.getRoomByUser({ userIds: auth.user.id, room_id })
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }

    const trx = await Database.beginTransaction()
    try {
      const image = await RoomService.removeImage(id, trx)
      await GalleryService.addFromView(
        { estate_id: room.estate_id, url: image.url, file_name: image.file_name },
        trx
      )
      await EstateService.updateCover({ room: room.toJSON(), removeImage: image }, trx)
      Event.fire('estate::update', room.estate_id)

      await trx.commit()
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async getEstateRooms({ request, auth, response }) {
    const { estate_id } = request.all()
    const rooms = await RoomService.getRoomsByEstate(estate_id)

    response.res(rooms)
  }

  async getRoomById({ request, response }) {
    const { estate_id, room_id } = request.all()
    let room = await Room.query()
      .select(Database.raw('rooms.*'))
      .select(Database.raw('json_agg (amenities order by sequence_order desc) as amenities'))
      .leftJoin('amenities', function () {
        this.on('amenities.room_id', 'rooms.id')
          .on('amenities.room_id', room_id)
          .on(Database.raw(`"amenities"."status" != ${STATUS_DELETE}`))
          .on(Database.raw(`"amenities"."location" = 'room'`))
      })
      .where('rooms.id', room_id)
      .where('rooms.estate_id', estate_id)
      .groupBy('rooms.id')
      .first()
    room = room.toJSON()
    return response.res(room)
  }
}

module.exports = RoomController
