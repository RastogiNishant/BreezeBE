'use strict'

const yup = require('yup')

const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class InviteInToVisit extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      tenant_id: id.required(),
    })
}

module.exports = InviteInToVisit
