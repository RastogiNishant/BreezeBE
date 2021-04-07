'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class RoomId extends Base {
  static schema = () =>
    yup.object().shape({
      room_id: id.required(),
    })
}

module.exports = RoomId
