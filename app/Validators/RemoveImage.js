'use strict'

const yup = require('yup')
const Base = require('./Base')
const { phoneSchema } = require('../Libs/schemas.js')

class RemoveImage extends Base {
  static schema = () =>
    yup.object().shape({
      uri: yup.string().required(),
    })
}

module.exports = RemoveImage
