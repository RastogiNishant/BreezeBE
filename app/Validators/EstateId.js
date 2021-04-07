'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class EstateId extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
    })
}

module.exports = EstateId
