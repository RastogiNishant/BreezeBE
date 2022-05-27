'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class PassportId extends Base {
  static schema = () =>
    yup.object().shape({
      passport_id: id.required(),
    })
}

module.exports = PassportId
