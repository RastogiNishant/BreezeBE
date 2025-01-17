'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class MatchMoveToNewEstate extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      user_id: id.required(),
      new_estate_id: id.required()
    })
}

module.exports = MatchMoveToNewEstate
