'use strict'

const moment = require('moment')
const uuid = require('uuid')

const Drive = use('Drive')
const Estate = use('App/Models/Estate')
const Room = use('App/Models/Room')
const HttpException = use('App/Exceptions/HttpException')
const RoomService = use('App/Services/RoomService')

class RoomController {
  /**
   *
   */
  async createRoom({ request, auth, response }) {
    const { estate_id, ...roomData } = request.all()
    await Estate.findByOrFail({ user_id: auth.user.id, id: estate_id })
    const room = await Room.createItem({
      ...roomData,
      estate_id,
    })

    response.res(room)
  }

  /**
   *
   */
  async updateRoom({ request, auth, response }) {
    const { estate_id, room_id, ...data } = request.all()
    // Get room and check estate owner
    const room = await RoomService.getRoomByUser(auth.user.id, room_id)
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }

    room.merge(data)
    await room.save()

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

    response.res(true)
  }

  /**
   *
   */
  async addRoomPhoto({ request, auth, response }) {
    const { room_id } = request.all()
    const room = await RoomService.getRoomByUser(auth.user.id, room_id)
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }

    const image = request.file('file')
    const filename = `${uuid.v4()}.${image.extname}`
    const filePathName = `${moment().format('YYYYMM')}/${filename}`
    await Drive.disk('s3public').put(filePathName, Drive.getStream(image.tmpPath), {
      ACL: 'public-read',
      ContentType: image.headers['content-type'],
    })

    room.addImage(filePathName)
    await room.save()

    response.res(room)
  }

  /**
   *
   */
  async removeRoomPhoto({ request, auth, response }) {
    const { room_id, index } = request.all()
    const room = await RoomService.getRoomByUser(auth.user.id, room_id)
    if (!room) {
      throw new HttpException('Invalid room', 404)
    }
    room.removeImage(index)
    room.save()

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
