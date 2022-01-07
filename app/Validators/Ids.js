'use strict'

const yup = require('yup')

const Base = require('./Base')
class Ids extends Base {
  static schema = () =>
    yup.object().shape({
      ids: yup.array().of(yup.number().integer().positive()),
    })
}

module.exports = Ids


