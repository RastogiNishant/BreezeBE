'use strict'

const { countBy } = require('lodash')
const moment = require('moment')
const uuid = require('uuid')
const AppException = use('App/Exceptions/AppException')
const Logger = use('Logger')

const Drive = use('Drive')
const Event = use('Event')
const Estate = use('App/Models/Estate')
const Room = use('App/Models/Room')
const HttpException = use('App/Exceptions/HttpException')
const RoomService = use('App/Services/RoomService')
const EstatePermissionService = use('App/Services/EstatePermissionService')
const EstateService = use('App/Services/EstateService')
const {
  PROPERTY_MANAGE_ALLOWED,
  ROLE_LANDLORD,
  ROLE_PROPERTY_MANAGER,
  SUPPORTED_IMAGE_FORMAT,
} = require('../../constants')
const ImageService = require('../../Services/ImageService')
class RoomController {
  /**
   *
   */
  async createRoom({ request, auth, response }) {
    const { estate_id, ...roomData } = request.all()
    try {
      let userIds = [auth.user.id]
      if (auth.user.role === ROLE_PROPERTY_MANAGER) {
        userIds = await EstatePermissionService.getLandlordIds(
          auth.user.id,
          PROPERTY_MANAGE_ALLOWED
        )
      }

      await Estate.query().where('id', estate_id).whereIn('user_id', userIds).firstOrFail()

      if (roomData.favorite) {
        await Room.query()
          .where('estate_id', estate_id)
          .where('type', roomData.type)
          .update({ favorite: false })
      }
      const room = await Room.createItem({
        ...roomData,
        estate_id,
      })
      Event.fire('estate::update', estate_id)

      response.res(room)
    } catch (e) {
      Logger.error('Create Room error', e)
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

    const room = await RoomService.getRoomByUser(userIds, room_id)
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }

    if (data.favorite) {
      await Room.query()
        .where('estate_id', estate_id)
        .where('type', data.type)
        .update({ favorite: false })
    }
    room.merge(data)
    await room.save()
    Event.fire('estate::update', estate_id)

    response.res(room)
  }

  /**
   *
   */
  async removeRoom({ request, auth, response }) {
    const { room_id } = request.all()
    const room = await RoomService.getRoomByUser(auth.user.id, room_id)
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }
    await RoomService.removeRoom(room_id)
    Event.fire('estate::update', room.estate_id)

    response.res(true)
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
    const room = await RoomService.getRoomByUser(auth.user.id, room_id)
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }
    try {
      const imageIds = await ImageService.getImageIds(room_id, ids)
      if (imageIds.length != ids.length) {
        throw new HttpException("Some imageIds don't exist")
      }
      await ImageService.updateOrder(ids)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
    response.res(true)
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

    const room = await RoomService.getRoomByUser(userIds, room_id)
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }

    try {
      const image = request.file('file')
      const ext = image.extname
        ? image.extname
        : image.clientName.toLowerCase().replace(/.*(jpeg|jpg|png)$/, '$1')
      const filename = `${uuid.v4()}.${ext}`
      const filePathName = `${moment().format('YYYYMM')}/${filename}`

      await Drive.disk('s3public').put(filePathName, Drive.getStream(image.tmpPath), {
        ACL: 'public-read',
        ContentType: image.headers['content-type'],
      })
      const imageObj = await RoomService.addImage(filePathName, room, 's3public')

      if (!room.cover) {
        await EstateService.setCover(room.estate_id, filePathName)
      }
      Event.fire('estate::update', room.estate_id)
      response.res(imageObj)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   */
  async removeRoomPhoto({ request, auth, response }) {
    const { room_id, id } = request.all()
    const room = await RoomService.getRoomByUser(auth.user.id, room_id)
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }
    await RoomService.removeImage(id)
    Event.fire('estate::update', room.estate_id)

    response.res(true)
  }

  /**
   *
   */
  async getEstateRooms({ request, auth, response }) {
    const { estate_id } = request.all()
    const rooms = await RoomService.getRoomsByEstate(estate_id)

    response.res(rooms)
  }
}

module.exports = RoomController
