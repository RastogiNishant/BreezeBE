'use strict'

const Estate = use('App/Models/Estate')
const Room = use('App/Models/Room')

class RoomController {
  /**
   *
   */
  async createRoom({ request, auth, response }) {
    const { estate_id, options, ...roomData } = request.all()
    await Estate.findByOrFail({ user_id: auth.user.id, id: estate_id })

    let data = {
      ...roomData,
      estate_id,
    }
    if (options) {
      data.options = JSON.stringify(options)
    }

    const room = await Room.createItem(data)

    response.res(room)
  }

  /**
   *
   */
  async updateRoom({ request, auth, response }) {
    response.res(true)
  }

  /**
   *
   */
  async removeRoom({ request, auth, response }) {
    response.res(true)
  }

  /**
   *
   */
  async addRoomPhoto({ request, auth, response }) {
    response.res(true)
  }

  /**
   *
   */
  async removeRoomPhoto({ request, auth, response }) {
    response.res(true)
  }
}

module.exports = RoomController
