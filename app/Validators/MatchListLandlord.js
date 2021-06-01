'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class MatchListLandlord extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      filters: yup.object().shape({
        knock: yup.boolean(),
        buddy: yup.boolean(),
        invite: yup.boolean(),
        visit: yup.boolean(),
        top: yup.boolean(),
        commit: yup.boolean(),
      }),
    })
}

module.exports = MatchListLandlord
