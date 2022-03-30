'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class CreateRoom extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      name: yup.string().max(255),
      type: yup.number().positive().required(),
      area: yup.number().min(0),
      options: yup.array().of(yup.string().lowercase().trim()),
      favorite: yup.boolean(),
      order: yup.number().positive()
    })
}

module.exports = CreateRoom
