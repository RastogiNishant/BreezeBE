'use strict'

const { STATUS_DELETE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Room = use('App/Models/Room')
const { groupBy } = require('lodash')
const OptionService = use('App/Services/OptionService')

class EstateRoomTypeUniqueSchema extends Schema {
  async up() {
    const roomTypes = OptionService.getRoomTypes()
    const getRoomType = (type) => {
      const roomType = roomTypes.find((rt) => parseInt(rt.key_index) === parseInt(type))
      return roomType?.locale_key || null
    }

    const rooms = (await Room.query().fetch()).toJSON()

    const groupRooms = groupBy(rooms || [], (room) => {
      return [room.estate_id, room.type]
    })

    const keys = Object.keys(groupRooms)
    let i = 0

    while (i < keys.length) {
      const groupRoom = groupRooms[keys[i]]
      if (!groupRoom || !groupRoom.length) continue

      const roomBaseName = getRoomType(groupRoom[0].type)
      await Promise.all(
        groupRoom.map(async (gr, index) => {
          const extraName = index ? `${index + 1}` : ``
          await Room.query()
            .where('id', gr.id)
            .update({ name: `${roomBaseName} ${extraName}` })
        })
      )
      i++
    }
  }

  down() {}
}

module.exports = EstateRoomTypeUniqueSchema
