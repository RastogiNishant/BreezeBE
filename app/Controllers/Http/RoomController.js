'use strict'

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
const EstateService = use('App/Services/EstateService')

class RoomController {
  /**
   *
   */
  async createRoom({ request, auth, response }) {
    const { estate_id, ...roomData } = request.all()
    try{
      await Estate.findByOrFail({ user_id: auth.user.id, id: estate_id })
      
          const room = await Room.createItem({
            ...roomData,
            estate_id,
          })
          Event.fire('estate::update', estate_id)
      
          response.res(room)
    }catch(e) {
      Logger.error('Create Room error', e);
      throw new HttpException(e.message, 400)
    }
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
    console.log( 'image', image)    

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
