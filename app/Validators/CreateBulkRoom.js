'use strict'

const yup = require('yup')
const Base = require('./Base')
const CreateRoom = require('./CreateRoom')
const { id } = require('../Libs/schemas.js')
const { omit } = require('lodash')

class CreateBulkRoom extends Base {
  static schema = () => {
    return yup.object().shape({
      estate_id: id.required(),
      rooms: yup.array().of(CreateRoom.schema()).required(),
    })
  }
}

module.exports = CreateBulkRoom
