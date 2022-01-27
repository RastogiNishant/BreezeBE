'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class LandlordId extends Base {
  static schema = () =>
    yup.object().shape({
      landlord_id: id.required(),
    })
}

module.exports = LandlordId
