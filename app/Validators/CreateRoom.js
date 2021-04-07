'use strict'

const yup = require('yup')
const Base = require('./Base')

class CreateRoom extends Base {
  static schema = () =>
    yup.object().shape({
      type: yup.number().positive(),
      area: yup.number().min(0),
      options: yup.array().of(yup.string().lowercase().trim()),
    })
}

module.exports = CreateRoom