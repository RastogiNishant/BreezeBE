'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class Id extends Base {
  static schema = () =>
    yup.object().shape({
      id: id.required(),
    })
}

module.exports = Id
