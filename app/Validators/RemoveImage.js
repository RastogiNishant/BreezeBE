'use strict'

const yup = require('yup')
const Base = require('./Base')

class RemoveImage extends Base {
  static schema = () =>
    yup.object().shape({
      index: yup.number().min(0),
    })
}

module.exports = RemoveImage
