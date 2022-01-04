'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class LandlordVisitCancel extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: estate_id.required(),
      tenant_id: tenant_id.required(),
    })
}

module.exports = LandlordVisitCancel
